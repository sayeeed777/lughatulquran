import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buckwalterToArabic } from "./buckwalter";

type RootMeaningMap = Map<string, string>;

let cachedMap: RootMeaningMap | null = null;
let cachedLoadError: string | null = null;

const candidatePaths = () =>
  [
    process.env.ROOT_MEANINGS_PATH,
    join(process.cwd(), "app/data/root-meanings.qj.json"),
    join(process.cwd(), "app/data/root-meanings.json"),
    join(process.cwd(), "public/data/root-meanings.qj.json"),
    join(process.cwd(), "public/data/root-meanings.json")
  ].filter((value): value is string => Boolean(value));

const normalizeRootKey = (value: string) => value.replace(/\s+/g, "").trim();
const normalizeMeaning = (value: string) => value.replace(/\s+/g, " ").trim();

const loadRootMeanings = () => {
  if (cachedMap) return cachedMap;
  if (cachedLoadError) return null;

  for (const candidate of candidatePaths()) {
    if (!existsSync(candidate)) continue;
    try {
      const payload = JSON.parse(readFileSync(candidate, "utf8")) as unknown;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        continue;
      }

      const map: RootMeaningMap = new Map();
      for (const [rawKey, rawMeaning] of Object.entries(payload as Record<string, unknown>)) {
        if (typeof rawKey !== "string" || typeof rawMeaning !== "string") continue;
        const normalizedKey = normalizeRootKey(rawKey);
        const normalizedMeaning = normalizeMeaning(rawMeaning);
        if (!normalizedKey || !normalizedMeaning) continue;
        map.set(normalizedKey, normalizedMeaning);
      }

      cachedMap = map;
      return map;
    } catch {
      continue;
    }
  }

  cachedLoadError = "Primary root-meaning dataset not found.";
  return null;
};

export const getPrimaryRootMeaning = (root: string) => {
  const map = loadRootMeanings();
  if (!map || !root) return null;

  const normalizedRaw = normalizeRootKey(root);
  if (normalizedRaw && map.has(normalizedRaw)) {
    return map.get(normalizedRaw) || null;
  }

  const arabicRoot = normalizeRootKey(buckwalterToArabic(root));
  if (!arabicRoot) return null;

  return map.get(arabicRoot) || null;
};

export const hasPrimaryRootMeanings = () => Boolean(loadRootMeanings());

export const getPrimaryRootMeaningsLoadError = () => cachedLoadError;

