import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { buckwalterToArabic, normalizeRootKey } from "./buckwalter";

export type RootExplorerDerivative = {
  form: string;
  count: number;
  totalInQuran?: number;
};

export type RootExplorerSurahOccurrence = {
  surah: number;
  surahName: string;
  totalRootInSurah: number;
  derivatives: RootExplorerDerivative[];
};

export type RootExplorerAyahOccurrence = {
  surah: number;
  ayah: number;
  text: string;
  highlightedHtml?: string;
  derivedForms: string[];
};

export type RootExplorerLexEntry = {
  id: string;
  label: string;
  definitionHtml: string;
  isRoot?: boolean;
  isMain?: boolean;
};

export type RootExplorerLexSnapshot = {
  wordGrammar?: string | null;
  derivativeNote?: string | null;
  rootDefinitionHtml?: string | null;
  mainDefinitionHtml?: string | null;
  mainEntryId?: string | null;
  entries: RootExplorerLexEntry[];
  source?: {
    provider?: string;
    fetchedAt?: string | null;
    refword?: string | null;
    lexword?: string | null;
  };
};

export type RootExplorerPayload = {
  root: string;
  rootArabic: string;
  stats: {
    totalOccurrences: number;
    derivativeCount: number;
    surahCount: number;
    ayahCount: number;
  };
  derivatives: RootExplorerDerivative[];
  surahOccurrences: RootExplorerSurahOccurrence[];
  ayahOccurrences: RootExplorerAyahOccurrence[];
  lexSnapshot?: RootExplorerLexSnapshot | null;
  source?: {
    provider?: string;
    fetchedAt?: string | null;
  };
};

let cachedLoadError: string | null = null;
const payloadCache = new Map<string, RootExplorerPayload | null>();

const getRootExplorerDir = () =>
  process.env.ROOT_EXPLORER_DIR || join(process.cwd(), "app/data/root-explorer");

const resolveNormalizedRoot = (root: string) => {
  const normalizedDirect = normalizeRootKey(root || "");
  if (normalizedDirect) return normalizedDirect;
  return normalizeRootKey(buckwalterToArabic(root || ""));
};

export const rootExplorerFileSlug = (root: string) => {
  const normalized = resolveNormalizedRoot(root);
  if (!normalized) return "";
  return Array.from(normalized)
    .map((char) => char.codePointAt(0)?.toString(16).padStart(4, "0") || "")
    .filter(Boolean)
    .join("-");
};

const getRootExplorerPath = (root: string) => {
  const slug = rootExplorerFileSlug(root);
  if (!slug) return "";
  return join(getRootExplorerDir(), `${slug}.json`);
};

export const getRootExplorerPayload = async (root: string) => {
  const normalized = resolveNormalizedRoot(root);
  if (!normalized) return null;
  if (payloadCache.has(normalized)) {
    return payloadCache.get(normalized) || null;
  }

  const filePath = getRootExplorerPath(normalized);
  if (!filePath || !existsSync(filePath)) {
    payloadCache.set(normalized, null);
    return null;
  }

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as RootExplorerPayload;
    payloadCache.set(normalized, parsed);
    return parsed;
  } catch (error) {
    cachedLoadError = error instanceof Error ? error.message : "Failed to load root explorer data.";
    payloadCache.set(normalized, null);
    return null;
  }
};

export const hasRootExplorerPayload = async (root: string) =>
  Boolean(await getRootExplorerPayload(root));

export const getRootExplorerLoadError = () => cachedLoadError;
