import "server-only";

import quranSearchIndex from "../data/quran-search-index.json";
import surahNames from "../data/quran-metadata-surah-name.json";
import { normalizeQuranDisplayArabic } from "./utils";

type SearchIndexEntry = {
  k: string;
  s: number;
  a: number;
  ar: string;
  en: string;
  sa?: string;
  sn?: string;
  rp?: string;
  pg?: number | null;
  j?: number | null;
  wg?: string[];
  tl?: string[];
  rb?: string[];
  ra?: string[];
  lb?: string[];
  la?: string[];
};

export type LocalSearchResult = {
  surah: number | null;
  ayah: number | null;
  text: string;
  translation: string;
  matchType?: "surah" | "arabic" | "translation" | "gloss" | "transliteration" | "root" | "lemma";
  matchLabel?: string;
  page?: number | null;
  juz?: number | null;
  matchedRoot?: string | null;
};

type PreparedSearchEntry = SearchIndexEntry & {
  arNorm: string;
  enNorm: string;
  glossNorm: string;
  translitNorm: string;
  rootsArabicNorm: string[];
  lemmasArabicNorm: string[];
};

const LOCAL_MAX_RESULTS = 40;
const TAG_RE = /<[^>]*>/g;
const MULTISPACE_RE = /\s+/g;
const COMBINING_MARKS_RE = /[\u0300-\u036f]/g;
const ARABIC_DIACRITICS_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

const rawIndex = quranSearchIndex as SearchIndexEntry[];
const rawSurahNames = surahNames as Record<string, {
  id: number;
  name?: string;
  name_simple?: string;
  name_arabic?: string;
}>;

let preparedIndex: PreparedSearchEntry[] | null = null;

const cleanText = (value: string | null | undefined): string =>
  String(value || "")
    .replace(TAG_RE, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(MULTISPACE_RE, " ")
    .trim();

const normalizeForSearch = (value: string): string =>
  cleanText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS_RE, "")
    .replace(ARABIC_DIACRITICS_RE, "")
    .replace(MULTISPACE_RE, " ")
    .trim();

const normalizeBuckwalterLike = (value: string): string =>
  String(value || "").replace(/\s+/g, "").trim();

const includesAllTerms = (haystack: string, terms: string[]) =>
  Boolean(haystack) && terms.every((term) => haystack.includes(term));

const containsWholeTerm = (haystack: string, term: string) =>
  Boolean(term) && new RegExp(`(^|\\s)${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`).test(haystack);

const unique = (values: Array<string | undefined>) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const item = String(value || "").trim();
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
};

const getPreparedIndex = () => {
  if (preparedIndex) return preparedIndex;

  preparedIndex = rawIndex.map((entry) => ({
    ...entry,
    arNorm: normalizeForSearch(entry.ar),
    enNorm: normalizeForSearch(entry.en),
    glossNorm: normalizeForSearch((entry.wg || []).join(" ")),
    translitNorm: normalizeForSearch((entry.tl || []).join(" ")),
    rootsArabicNorm: unique((entry.ra || []).map(normalizeForSearch)),
    lemmasArabicNorm: unique((entry.la || []).map(normalizeForSearch))
  }));

  return preparedIndex;
};

const getMode = (query: string) => {
  const trimmed = query.trim();
  if (/^root\s*:/i.test(trimmed)) {
    return { mode: "root" as const, value: trimmed.replace(/^root\s*:/i, "").trim() };
  }
  if (/^lemma\s*:/i.test(trimmed)) {
    return { mode: "lemma" as const, value: trimmed.replace(/^lemma\s*:/i, "").trim() };
  }
  if (/^surah\s*:/i.test(trimmed)) {
    return { mode: "surah" as const, value: trimmed.replace(/^surah\s*:/i, "").trim() };
  }
  return { mode: "all" as const, value: trimmed };
};

const searchSurahStarts = (query: string): Array<LocalSearchResult & { score: number }> => {
  const normalized = normalizeForSearch(query);
  if (!normalized) return [];

  return Object.values(rawSurahNames)
    .flatMap((surah) => {
      const names = unique([
        normalizeForSearch(surah.name_simple || ""),
        normalizeForSearch(surah.name_arabic || ""),
        normalizeForSearch(surah.name || "")
      ]);

      let score = 0;
      if (names.some((name) => name === normalized)) {
        score = 26;
      } else if (names.some((name) => name.startsWith(normalized))) {
        score = 18;
      } else if (names.some((name) => name.includes(normalized))) {
        score = 12;
      }

      return score
        ? [{
            surah: surah.id,
            ayah: 1,
            text: surah.name_arabic || "",
            translation: `Surah ${surah.name_simple || surah.name || surah.id}`,
            matchType: "surah" as const,
            matchLabel: "Surah name",
            score
          }]
        : [];
    })
    .sort((a, b) => b.score - a.score || (a.surah || 0) - (b.surah || 0))
    .slice(0, 10);
};

const findMatchedArabicRoot = (
  entry: SearchIndexEntry,
  normalized: string,
  normalizedBuckwalter: string
) => {
  const arabicRoots = entry.ra || [];
  if (normalized) {
    const matchedArabic = arabicRoots.find((root) => {
      const normalizedRoot = normalizeForSearch(root);
      return normalizedRoot === normalized || normalizedRoot.includes(normalized);
    });
    if (matchedArabic) return matchedArabic;
  }

  if (normalizedBuckwalter) {
    const buckRoots = entry.rb || [];
    const matchedIndex = buckRoots.findIndex((root) => {
      const normalizedRoot = normalizeBuckwalterLike(root);
      return normalizedRoot === normalizedBuckwalter || normalizedRoot.includes(normalizedBuckwalter);
    });
    if (matchedIndex >= 0) {
      return arabicRoots[matchedIndex] || arabicRoots[0] || null;
    }
  }

  return arabicRoots[0] || null;
};

export const searchLocalQuran = (query: string, limit = LOCAL_MAX_RESULTS): LocalSearchResult[] => {
  const { mode, value } = getMode(query);
  const normalized = normalizeForSearch(value);
  const normalizedBuckwalter = normalizeBuckwalterLike(value);
  if (!normalized && !normalizedBuckwalter) return [];

  if (mode === "surah") {
    return searchSurahStarts(value).map(({ score: _score, ...result }) => result);
  }

  const terms = normalized ? normalized.split(" ").filter(Boolean) : [];
  const results: Array<LocalSearchResult & { score: number }> = [];

  for (const entry of getPreparedIndex()) {
    let score = 0;
    let matchType: LocalSearchResult["matchType"];
    let matchLabel = "";

    const rootBuck = unique((entry.rb || []).map(normalizeBuckwalterLike));
    const lemmaBuck = unique((entry.lb || []).map(normalizeBuckwalterLike));

    const hasRootMatch =
      (!!normalized && entry.rootsArabicNorm.some((root) => root === normalized || root.includes(normalized)))
      || (!!normalizedBuckwalter && rootBuck.some((root) => root === normalizedBuckwalter || root.includes(normalizedBuckwalter)));

    const hasLemmaMatch =
      (!!normalized && entry.lemmasArabicNorm.some((lemma) => lemma === normalized || lemma.includes(normalized)))
      || (!!normalizedBuckwalter && lemmaBuck.some((lemma) => lemma === normalizedBuckwalter || lemma.includes(normalizedBuckwalter)));

    const hasArabicPhrase = terms.length && includesAllTerms(entry.arNorm, terms);
    const hasEnglishPhrase = terms.length && includesAllTerms(entry.enNorm, terms);
    const hasGlossMatch = terms.length && includesAllTerms(entry.glossNorm, terms);
    const hasTranslitMatch = terms.length && includesAllTerms(entry.translitNorm, terms);

    if (mode === "root") {
      if (!hasRootMatch) continue;
      score = 34;
      matchType = "root";
      matchLabel = `Root match`;
    } else if (mode === "lemma") {
      if (!hasLemmaMatch) continue;
      score = 34;
      matchType = "lemma";
      matchLabel = `Lemma match`;
    } else {
      if (normalized && entry.arNorm === normalized) {
        score = 42;
        matchType = "arabic";
        matchLabel = "Exact Arabic";
      } else if (normalized && containsWholeTerm(entry.arNorm, normalized)) {
        score = 36;
        matchType = "arabic";
        matchLabel = "Arabic text";
      } else if (hasArabicPhrase) {
        score = 31 + (normalized && entry.arNorm.startsWith(normalized) ? 2 : 0);
        matchType = "arabic";
        matchLabel = "Arabic text";
      }

      if (normalized && entry.enNorm === normalized && score < 30) {
        score = 30;
        matchType = "translation";
        matchLabel = "Exact translation";
      } else if (normalized && containsWholeTerm(entry.enNorm, normalized) && score < 26) {
        score = 26;
        matchType = "translation";
        matchLabel = "English translation";
      } else if (hasEnglishPhrase && score < 23) {
        score = 23 + (normalized && entry.enNorm.startsWith(normalized) ? 1 : 0);
        matchType = "translation";
        matchLabel = "English translation";
      }

      if (hasGlossMatch && score < 20) {
        score = 20;
        matchType = "gloss";
        matchLabel = "Word meaning";
      }

      if (hasTranslitMatch && score < 17) {
        score = 17;
        matchType = "transliteration";
        matchLabel = "Transliteration";
      }

      if (hasLemmaMatch && score < 16) {
        score = 16;
        matchType = "lemma";
        matchLabel = "Lemma match";
      }

      if (hasRootMatch && score < 15) {
        score = 15;
        matchType = "root";
        matchLabel = "Root match";
      }
    }

    if (!score) continue;

    results.push({
      surah: entry.s,
      ayah: entry.a,
      text: normalizeQuranDisplayArabic(entry.ar),
      translation: entry.en,
      matchType,
      matchLabel,
      page: entry.pg ?? null,
      juz: entry.j ?? null,
      matchedRoot: hasRootMatch ? findMatchedArabicRoot(entry, normalized, normalizedBuckwalter) : null,
      score
    });
  }

  if (mode === "all") {
    const surahMatches = searchSurahStarts(value);
    results.push(...surahMatches);
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((a.surah || 0) !== (b.surah || 0)) return (a.surah || 0) - (b.surah || 0);
    return (a.ayah || 0) - (b.ayah || 0);
  });

  const seen = new Set<string>();
  const deduped: LocalSearchResult[] = [];
  for (const result of results) {
    const key = `${result.surah || 0}:${result.ayah || 0}:${result.matchType || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(result);
    if (deduped.length >= limit) break;
  }

  return deduped;
};
