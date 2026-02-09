import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buckwalterToArabic } from "./buckwalter";

export type LaneRootEntry = {
  root?: string;
  rootArabic?: string;
  coreMeanings?: string[];
  definitions?: string[];
};

type LaneLexiconMap = Map<string, LaneRootEntry>;

let cachedLexicon: LaneLexiconMap | null = null;
let cachedLaneError: string | null = null;

const laneCandidates = () =>
  [
    process.env.LANE_LEXICON_PATH,
    join(process.cwd(), "app/data/lane-lexicon.json"),
    join(process.cwd(), "app/data/lane_lexicon.json"),
    join(process.cwd(), "public/data/lane-lexicon.json")
  ].filter((value): value is string => Boolean(value));

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

const normalizeEntry = (value: unknown): LaneRootEntry | null => {
  if (!value || typeof value !== "object") return null;
  const entry = value as Record<string, unknown>;
  const coreMeanings = Array.isArray(entry.coreMeanings)
    ? entry.coreMeanings.filter((item): item is string => typeof item === "string")
    : [];
  const definitions = Array.isArray(entry.definitions)
    ? entry.definitions.filter((item): item is string => typeof item === "string")
    : [];
  const rootArabic = typeof entry.rootArabic === "string" ? entry.rootArabic : "";
  const root = typeof entry.root === "string" ? entry.root : "";
  return {
    root: root || undefined,
    rootArabic: rootArabic || undefined,
    coreMeanings,
    definitions
  };
};

const loadLaneLexicon = () => {
  if (cachedLexicon) return cachedLexicon;
  if (cachedLaneError) return null;

  for (const candidate of laneCandidates()) {
    if (!existsSync(candidate)) continue;
    try {
      const payload = JSON.parse(readFileSync(candidate, "utf8")) as unknown;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        continue;
      }
      const map: LaneLexiconMap = new Map();
      for (const [root, rawEntry] of Object.entries(payload as Record<string, unknown>)) {
        const normalized = normalizeEntry(rawEntry);
        if (!normalized) continue;
        const keys = [
          root,
          buckwalterToArabic(root),
          normalized.root || "",
          buckwalterToArabic(normalized.root || ""),
          normalized.rootArabic || ""
        ];
        for (const key of keys) {
          const normalizedKey = normalizeRootKey(key);
          if (!normalizedKey || map.has(normalizedKey)) continue;
          map.set(normalizedKey, normalized);
        }
      }
      cachedLexicon = map;
      return map;
    } catch {
      continue;
    }
  }

  cachedLaneError = "Lane lexicon file not found.";
  return null;
};

export const getLaneEntry = (root: string) => {
  const map = loadLaneLexicon();
  if (!map || !root) return null;
  const normalizedInput = normalizeRootKey(root);
  if (normalizedInput && map.has(normalizedInput)) {
    return map.get(normalizedInput) || null;
  }
  const convertedInput = normalizeRootKey(buckwalterToArabic(root));
  if (convertedInput && map.has(convertedInput)) {
    return map.get(convertedInput) || null;
  }
  return null;
};

export const hasLaneLexicon = () => Boolean(loadLaneLexicon());

export const getLaneLoadError = () => cachedLaneError;
