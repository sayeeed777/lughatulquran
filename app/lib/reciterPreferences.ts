import { AUDIO_RECITERS, DEFAULT_RECITER, STORAGE_KEYS } from "./constants";
import type { Reciter } from "./types";

const FALLBACK_RECITER: Reciter = DEFAULT_RECITER ?? AUDIO_RECITERS[0] ?? {
  id: "default",
  label: "Default",
  baseUrl: ""
};

export const LEGACY_DEFAULT_RECITER: Reciter = AUDIO_RECITERS[0] ?? FALLBACK_RECITER;

const VALID_RECITER_IDS = new Set(AUDIO_RECITERS.map((reciter) => reciter.id));

const RETURNING_USER_STORAGE_KEYS = [
  ...Object.values(STORAGE_KEYS).filter((key) => key !== STORAGE_KEYS.reciter),
  "study_mode_seen"
] as const;

const parseStoredReciterId = (rawValue: string | null): string | null => {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return rawValue;
  }
};

export function getStoredReciterId(storage: Pick<Storage, "getItem">): string | null {
  const reciterId = parseStoredReciterId(storage.getItem(STORAGE_KEYS.reciter));
  return reciterId && VALID_RECITER_IDS.has(reciterId) ? reciterId : null;
}

export function getReciterBootstrapMode(
  storage: Pick<Storage, "getItem">
): "stored" | "returning-user" | "new-user" {
  if (getStoredReciterId(storage)) {
    return "stored";
  }

  return RETURNING_USER_STORAGE_KEYS.some((key) => storage.getItem(key) !== null)
    ? "returning-user"
    : "new-user";
}

export function resolveBootstrappedReciterId(storage: Pick<Storage, "getItem">): string {
  const storedReciterId = getStoredReciterId(storage);
  if (storedReciterId) {
    return storedReciterId;
  }

  return getReciterBootstrapMode(storage) === "new-user"
    ? FALLBACK_RECITER.id
    : LEGACY_DEFAULT_RECITER.id;
}

export function resolveReciterById(reciterId?: string | null): Reciter {
  return AUDIO_RECITERS.find((reciter) => reciter.id === reciterId) ?? FALLBACK_RECITER;
}
