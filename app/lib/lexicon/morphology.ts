import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type MorphologyWordEntry = {
  surah: number;
  ayah: number;
  word: number;
  form: string;
  lemma?: string;
  root?: string;
};

type MorphologyIndex = {
  wordsByLocation: Map<string, MorphologyWordEntry>;
  refsByRoot: Map<string, Set<string>>;
  lemmasByRoot: Map<string, Set<string>>;
};

let cachedIndex: MorphologyIndex | null = null;
let cachedLoadError: string | null = null;
let indexPromise: Promise<MorphologyIndex | null> | null = null;

type ParsedMorphologyLine = {
  surah: number;
  ayah: number;
  word: number;
  part: number;
  form: string;
  features: string;
  root: string;
  lemma: string;
  isStem: boolean;
};

const LEGACY_LOCATION_RE = /^\((\d+):(\d+):(\d+):(\d+)\)\t([^\t]*)\t([^\t]*)\t(.+)$/;
const MUSTAFA_LOCATION_RE = /^(\d+):(\d+):(\d+):(\d+)\t([^\t]*)\t([^\t]*)\t(.+)$/;

const getCandidates = () =>
  [
    process.env.QURAN_CORPUS_MORPHOLOGY_PATH,
    join(process.cwd(), "app/data/quran-morphology.mustafa.txt"),
    join(process.cwd(), "public/data/quran-morphology.mustafa.txt"),
    join(process.cwd(), "app/data/quranic-corpus-morphology-0.4.txt"),
    join(process.cwd(), "app/data/quranic-corpus-morphology-0.4.zip"),
    "/tmp/quran-morphology.mustafa.txt"
  ].filter((value): value is string => Boolean(value));

const readCorpusText = () => {
  for (const candidate of getCandidates()) {
    if (!existsSync(candidate)) continue;
    try {
      if (candidate.endsWith(".txt")) {
        return readFileSync(candidate, "utf8");
      }
      if (candidate.endsWith(".zip")) {
        return execFileSync("unzip", ["-p", candidate], {
          encoding: "utf8",
          maxBuffer: 50 * 1024 * 1024
        });
      }
    } catch {
      continue;
    }
  }
  return null;
};

const parseFeatureValue = (features: string, key: "LEM" | "ROOT") => {
  const match = features.match(new RegExp(`(?:^|\\|)${key}:([^|\\t]+)`));
  return match?.[1]?.trim() || "";
};

const normalizeRootKey = (value: string) =>
  value
    .normalize("NFC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/\s+/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ؤئ]/g, "ء")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();

const parseMorphologyLine = (line: string): ParsedMorphologyLine | null => {
  const legacyMatch = line.match(LEGACY_LOCATION_RE);
  const match = legacyMatch || line.match(MUSTAFA_LOCATION_RE);
  if (!match) return null;

  const surah = Number(match[1]);
  const ayah = Number(match[2]);
  const word = Number(match[3]);
  const part = Number(match[4]);
  const form = match[5] || "";
  const features = match[7] || "";
  const root = parseFeatureValue(features, "ROOT");
  const lemma = parseFeatureValue(features, "LEM");

  if (!Number.isFinite(surah) || !Number.isFinite(ayah) || !Number.isFinite(word)) {
    return null;
  }

  return {
    surah,
    ayah,
    word,
    part: Number.isFinite(part) ? part : 0,
    form,
    features,
    root,
    lemma,
    isStem: features.includes("STEM|")
  };
};

const scoreEntry = (entry: ParsedMorphologyLine) => {
  // Prefer explicit stem rows when available (legacy corpus),
  // otherwise prefer rows that carry ROOT/LEM (mustafa0x format).
  const base = entry.isStem ? 100 : entry.root ? 80 : entry.lemma ? 60 : 0;
  return base + (entry.root ? 10 : 0) + (entry.lemma ? 4 : 0) - entry.part / 100;
};

const parseMorphology = (text: string): MorphologyIndex => {
  const wordsByLocation = new Map<string, MorphologyWordEntry>();
  const refsByRoot = new Map<string, Set<string>>();
  const lemmasByRoot = new Map<string, Set<string>>();
  const scoreByLocation = new Map<string, number>();

  for (const line of text.split(/\r?\n/)) {
    if (!line || line[0] === "#" || line.startsWith("LOCATION\t")) continue;
    const parsed = parseMorphologyLine(line);
    if (!parsed) continue;
    const { surah, ayah, word, form, root, lemma } = parsed;
    const key = `${surah}:${ayah}:${word}`;
    const score = scoreEntry(parsed);
    if (score <= 0) continue;

    const prevScore = scoreByLocation.get(key) ?? -Infinity;
    const prevValue = wordsByLocation.get(key);
    const shouldReplace = score > prevScore;
    const shouldMerge =
      score === prevScore &&
      !!prevValue &&
      ((!prevValue.root && !!root) || (!prevValue.lemma && !!lemma));

    if (shouldReplace || shouldMerge) {
      wordsByLocation.set(key, {
        surah,
        ayah,
        word,
        form,
        lemma: lemma || prevValue?.lemma,
        root: root || prevValue?.root
      });
      scoreByLocation.set(key, score);
    }
  }

  for (const entry of wordsByLocation.values()) {
    if (!entry.root) continue;
    const normalizedRoot = normalizeRootKey(entry.root);
    if (!normalizedRoot) continue;
    const refs = refsByRoot.get(normalizedRoot) ?? new Set<string>();
    refs.add(`${entry.surah}:${entry.ayah}`);
    refsByRoot.set(normalizedRoot, refs);

    if (entry.lemma) {
      const lemmas = lemmasByRoot.get(normalizedRoot) ?? new Set<string>();
      lemmas.add(entry.lemma);
      lemmasByRoot.set(normalizedRoot, lemmas);
    }
  }

  return {
    wordsByLocation,
    refsByRoot,
    lemmasByRoot
  };
};

const loadIndex = async () => {
  if (cachedIndex) return cachedIndex;
  if (cachedLoadError) return null;

  const corpusText = readCorpusText();
  if (!corpusText) {
    cachedLoadError = "Morphology corpus file not found.";
    return null;
  }

  cachedIndex = parseMorphology(corpusText);
  return cachedIndex;
};

export const getMorphologyIndex = async () => {
  if (cachedIndex) return cachedIndex;
  if (!indexPromise) {
    indexPromise = loadIndex();
  }
  return indexPromise;
};

export const getMorphologyWord = (
  index: MorphologyIndex | null,
  surah: number,
  ayah: number,
  word: number
) => {
  if (!index) return null;
  return index.wordsByLocation.get(`${surah}:${ayah}:${word}`) || null;
};

export const getRootReferences = (
  index: MorphologyIndex | null,
  root: string,
  limit = 80
) => {
  if (!index || !root) return [];
  const refs = index.refsByRoot.get(normalizeRootKey(root));
  if (!refs) return [];
  return [...refs]
    .sort((a, b) => {
      const [sA, aA] = a.split(":").map(Number);
      const [sB, aB] = b.split(":").map(Number);
      return sA === sB ? aA - aB : sA - sB;
    })
    .slice(0, limit);
};

export const getRootLemmas = (index: MorphologyIndex | null, root: string, limit = 10) => {
  if (!index || !root) return [];
  const lemmas = index.lemmasByRoot.get(normalizeRootKey(root));
  if (!lemmas) return [];
  return [...lemmas].slice(0, limit);
};

export const getMorphologyLoadError = () => cachedLoadError;
