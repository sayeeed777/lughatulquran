import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "app/data");
const OUTPUT_PATH = join(DATA_DIR, "quran-search-index.json");

const BUCKWALTER_TO_ARABIC = {
  "'": "ء",
  "|": "آ",
  ">": "أ",
  "&": "ؤ",
  "<": "إ",
  "}": "ئ",
  A: "ا",
  b: "ب",
  p: "ة",
  t: "ت",
  v: "ث",
  j: "ج",
  H: "ح",
  x: "خ",
  d: "د",
  "*": "ذ",
  r: "ر",
  z: "ز",
  s: "س",
  $: "ش",
  S: "ص",
  D: "ض",
  T: "ط",
  Z: "ظ",
  E: "ع",
  g: "غ",
  f: "ف",
  q: "ق",
  k: "ك",
  l: "ل",
  m: "م",
  n: "ن",
  h: "ه",
  w: "و",
  Y: "ى",
  y: "ي"
};

const LEGACY_LOCATION_RE = /^\((\d+):(\d+):(\d+):(\d+)\)\t([^\t]*)\t([^\t]*)\t(.+)$/;
const MUSTAFA_LOCATION_RE = /^(\d+):(\d+):(\d+):(\d+)\t([^\t]*)\t([^\t]*)\t(.+)$/;

const parseFeatureValue = (features, key) => {
  const match = features.match(new RegExp(`(?:^|\\|)${key}:([^|\\t]+)`));
  return match?.[1]?.trim() || "";
};

const scoreMorphologyEntry = (entry) => {
  const base = entry.isStem ? 100 : entry.root ? 80 : entry.lemma ? 60 : 0;
  return base + (entry.root ? 10 : 0) + (entry.lemma ? 4 : 0) - entry.part / 100;
};

const parseMorphologyLine = (line) => {
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
    root,
    lemma,
    isStem: features.includes("STEM|")
  };
};

const buckwalterToArabic = (value = "") => {
  let out = "";
  for (const char of value) {
    out += BUCKWALTER_TO_ARABIC[char] ?? char;
  }
  return out;
};

const uniqueLimited = (values, limit = 12) => {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const item = String(value || "").trim();
    if (!item || seen.has(item)) continue;
    seen.add(item);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
};

const buildJuzLookup = (juzMetadata) => {
  const byVerse = new Map();

  for (const juz of Object.values(juzMetadata)) {
    const juzNumber = Number(juz?.juz_number);
    if (!Number.isFinite(juzNumber)) continue;

    for (const [surahKey, rangesRaw] of Object.entries(juz?.verse_mapping || {})) {
      const surah = Number(surahKey);
      if (!Number.isFinite(surah)) continue;

      for (const rangeText of String(rangesRaw).split(",")) {
        const [startRaw, endRaw] = String(rangeText).split("-");
        const start = Number(startRaw);
        const end = Number(endRaw ?? startRaw);
        if (!Number.isFinite(start) || !Number.isFinite(end)) continue;

        for (let ayah = start; ayah <= end; ayah += 1) {
          byVerse.set(`${surah}:${ayah}`, juzNumber);
        }
      }
    }
  }

  return byVerse;
};

const buildMorphologyLookup = (text) => {
  const byLocation = new Map();
  const scoreByLocation = new Map();

  for (const line of text.split(/\r?\n/)) {
    if (!line || line[0] === "#" || line.startsWith("LOCATION\t")) continue;
    const parsed = parseMorphologyLine(line);
    if (!parsed) continue;

    const score = scoreMorphologyEntry(parsed);
    if (score <= 0) continue;

    const key = `${parsed.surah}:${parsed.ayah}:${parsed.word}`;
    const prevScore = scoreByLocation.get(key) ?? -Infinity;
    const prevValue = byLocation.get(key);
    const shouldReplace = score > prevScore;
    const shouldMerge =
      score === prevScore &&
      !!prevValue &&
      ((!prevValue.root && !!parsed.root) || (!prevValue.lemma && !!parsed.lemma));

    if (shouldReplace || shouldMerge) {
      byLocation.set(key, {
        root: parsed.root || prevValue?.root || "",
        lemma: parsed.lemma || prevValue?.lemma || ""
      });
      scoreByLocation.set(key, score);
    }
  }

  return byLocation;
};

const main = async () => {
  const [
    quranTextRaw,
    quranWordsRaw,
    surahMetadataRaw,
    juzMetadataRaw,
    morphologyRaw
  ] = await Promise.all([
    readFile(join(DATA_DIR, "quran-text.json"), "utf8"),
    readFile(join(DATA_DIR, "quran-words.json"), "utf8"),
    readFile(join(DATA_DIR, "quran-metadata-surah-name.json"), "utf8"),
    readFile(join(DATA_DIR, "quran-metadata-juz.json"), "utf8"),
    readFile(join(DATA_DIR, "quran-morphology.mustafa.txt"), "utf8")
  ]);

  const quranText = JSON.parse(quranTextRaw);
  const quranWords = JSON.parse(quranWordsRaw);
  const surahMetadata = JSON.parse(surahMetadataRaw);
  const juzMetadata = JSON.parse(juzMetadataRaw);

  const juzLookup = buildJuzLookup(juzMetadata);
  const morphologyLookup = buildMorphologyLookup(morphologyRaw);

  const entries = [];

  for (const [surahKey, ayahMap] of Object.entries(quranText)) {
    const surah = Number(surahKey);
    if (!Number.isFinite(surah)) continue;

    const surahMeta = surahMetadata[surahKey] || {};
    const surahWords = quranWords[surahKey] || {};

    for (const [ayahKey, verse] of Object.entries(ayahMap || {})) {
      const ayah = Number(ayahKey);
      if (!Number.isFinite(ayah) || !verse) continue;

      const rawWords = Array.isArray(surahWords[ayahKey]) ? surahWords[ayahKey] : [];
      const wordGlosses = [];
      const transliterations = [];
      const rootsBuck = [];
      const rootsArabic = [];
      const lemmasBuck = [];
      const lemmasArabic = [];

      for (const word of rawWords) {
        if (word?.t) wordGlosses.push(word.t);
        if (word?.tr) transliterations.push(word.tr);

        const morph = morphologyLookup.get(`${surah}:${ayah}:${word?.p}`);
        if (!morph) continue;

        if (morph.root) {
          rootsBuck.push(morph.root);
          rootsArabic.push(buckwalterToArabic(morph.root));
        }
        if (morph.lemma) {
          lemmasBuck.push(morph.lemma);
          lemmasArabic.push(buckwalterToArabic(morph.lemma));
        }
      }

      entries.push({
        k: `${surah}:${ayah}`,
        s: surah,
        a: ayah,
        ar: String(verse.ar || ""),
        en: String(verse.en || ""),
        sa: String(surahMeta.name_arabic || ""),
        sn: String(surahMeta.name_simple || ""),
        rp: String(surahMeta.revelation_place || ""),
        pg: Number(verse.pg || 0) || null,
        j: juzLookup.get(`${surah}:${ayah}`) || null,
        wg: uniqueLimited(wordGlosses, 16),
        tl: uniqueLimited(transliterations, 16),
        rb: uniqueLimited(rootsBuck, 10),
        ra: uniqueLimited(rootsArabic, 10),
        lb: uniqueLimited(lemmasBuck, 12),
        la: uniqueLimited(lemmasArabic, 12)
      });
    }
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(entries), "utf8");
  console.log(`Wrote ${entries.length} search entries to ${OUTPUT_PATH}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
