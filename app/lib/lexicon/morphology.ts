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

const LOCATION_RE = /^\((\d+):(\d+):(\d+):(\d+)\)\t([^\t]*)\t([^\t]*)\t(.+)$/;

const getCandidates = () =>
  [
    process.env.QURAN_CORPUS_MORPHOLOGY_PATH,
    join(process.cwd(), "app/data/quranic-corpus-morphology-0.4.txt"),
    join(process.cwd(), "app/data/quranic-corpus-morphology-0.4.zip"),
    "/Users/mdaminalsayeed/Downloads/quranic-corpus-morphology-0.4.txt",
    "/Users/mdaminalsayeed/Downloads/quranic-corpus-morphology-0.4.zip"
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

const parseMorphology = (text: string): MorphologyIndex => {
  const wordsByLocation = new Map<string, MorphologyWordEntry>();
  const refsByRoot = new Map<string, Set<string>>();
  const lemmasByRoot = new Map<string, Set<string>>();

  for (const line of text.split(/\r?\n/)) {
    if (!line || line[0] === "#" || line.startsWith("LOCATION\t")) continue;
    const match = line.match(LOCATION_RE);
    if (!match) continue;

    const surah = Number(match[1]);
    const ayah = Number(match[2]);
    const word = Number(match[3]);
    const form = match[5] || "";
    const features = match[7] || "";

    if (!features.includes("STEM|")) continue;

    const lemma = parseFeatureValue(features, "LEM");
    const root = parseFeatureValue(features, "ROOT");
    const key = `${surah}:${ayah}:${word}`;

    if (!wordsByLocation.has(key)) {
      wordsByLocation.set(key, {
        surah,
        ayah,
        word,
        form,
        lemma: lemma || undefined,
        root: root || undefined
      });
    }

    if (root) {
      const refs = refsByRoot.get(root) ?? new Set<string>();
      refs.add(`${surah}:${ayah}`);
      refsByRoot.set(root, refs);

      if (lemma) {
        const lemmas = lemmasByRoot.get(root) ?? new Set<string>();
        lemmas.add(lemma);
        lemmasByRoot.set(root, lemmas);
      }
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
  const refs = index.refsByRoot.get(root);
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
  const lemmas = index.lemmasByRoot.get(root);
  if (!lemmas) return [];
  return [...lemmas].slice(0, limit);
};

export const getMorphologyLoadError = () => cachedLoadError;
