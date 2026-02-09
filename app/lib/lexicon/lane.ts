import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type LaneRootEntry = {
  root?: string;
  rootArabic?: string;
  coreMeanings?: string[];
  definitions?: string[];
};

type LaneLexiconMap = Record<string, LaneRootEntry>;

let cachedLexicon: LaneLexiconMap | null = null;
let cachedLaneError: string | null = null;

const laneCandidates = () =>
  [
    process.env.LANE_LEXICON_PATH,
    join(process.cwd(), "app/data/lane-lexicon.json"),
    join(process.cwd(), "app/data/lane_lexicon.json"),
    join(process.cwd(), "public/data/lane-lexicon.json")
  ].filter((value): value is string => Boolean(value));

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
      const map: LaneLexiconMap = {};
      for (const [root, rawEntry] of Object.entries(payload as Record<string, unknown>)) {
        const normalized = normalizeEntry(rawEntry);
        if (!normalized) continue;
        map[root] = normalized;
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
  return map[root] || null;
};

export const hasLaneLexicon = () => Boolean(loadLaneLexicon());

export const getLaneLoadError = () => cachedLaneError;

