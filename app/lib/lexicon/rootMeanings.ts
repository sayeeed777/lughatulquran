import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { buckwalterToArabic, normalizeRootKey } from "./buckwalter";

type RootMeaningMap = Map<string, string>;

let cachedMap: RootMeaningMap | null = null;
let cachedLoadError: string | null = null;
let loadPromise: Promise<RootMeaningMap | null> | null = null;

const candidatePaths = () =>
  [
    process.env.ROOT_MEANINGS_PATH,
    join(process.cwd(), "app/data/root-meanings.primary.json"),
    join(process.cwd(), "app/data/root-meanings.qj.json"),
    join(process.cwd(), "app/data/root-meanings.json"),
    join(process.cwd(), "public/data/root-meanings.primary.json"),
    join(process.cwd(), "public/data/root-meanings.qj.json"),
    join(process.cwd(), "public/data/root-meanings.json")
  ].filter((value): value is string => Boolean(value));

const normalizeMeaning = (value: string) => value.replace(/\s+/g, " ").trim();

const loadRootMeaningsAsync = async (): Promise<RootMeaningMap | null> => {
  if (cachedMap) return cachedMap;
  if (cachedLoadError) return null;

  const map: RootMeaningMap = new Map();
  let loadedAny = false;

  for (const candidate of candidatePaths()) {
    if (!existsSync(candidate)) continue;
    try {
      const raw = await readFile(candidate, "utf8");
      const payload = JSON.parse(raw) as unknown;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        continue;
      }
      loadedAny = true;
      for (const [rawKey, rawMeaning] of Object.entries(payload as Record<string, unknown>)) {
        if (typeof rawKey !== "string" || typeof rawMeaning !== "string") continue;
        const normalizedKey = normalizeRootKey(rawKey);
        const normalizedMeaning = normalizeMeaning(rawMeaning);
        if (!normalizedKey || !normalizedMeaning) continue;
        if (map.has(normalizedKey)) continue;
        map.set(normalizedKey, normalizedMeaning);
      }
    } catch {
      continue;
    }
  }

  if (loadedAny && map.size > 0) {
    cachedMap = map;
    return map;
  }

  cachedLoadError = "Primary root-meaning dataset not found.";
  return null;
};

const loadRootMeanings = async (): Promise<RootMeaningMap | null> => {
  if (cachedMap) return cachedMap;
  if (!loadPromise) {
    loadPromise = loadRootMeaningsAsync();
  }
  return loadPromise;
};

export const getPrimaryRootMeaning = async (root: string) => {
  const map = await loadRootMeanings();
  if (!map || !root) return null;

  const normalizedRaw = normalizeRootKey(root);
  if (normalizedRaw && map.has(normalizedRaw)) {
    return map.get(normalizedRaw) || null;
  }

  const arabicRoot = normalizeRootKey(buckwalterToArabic(root));
  if (!arabicRoot) return null;

  return map.get(arabicRoot) || null;
};

export const hasPrimaryRootMeanings = async () => Boolean(await loadRootMeanings());

export const getPrimaryRootMeaningsLoadError = () => cachedLoadError;
