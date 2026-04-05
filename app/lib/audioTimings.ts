import "server-only";

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ChapterAudioTimingSnapshot } from "./types";

export const LOCAL_AUDIO_TIMING_RECITERS = ["husary", "alafasy"] as const;

const localAudioTimingReciterSet = new Set<string>(LOCAL_AUDIO_TIMING_RECITERS);
const timingCache = new Map<string, ChapterAudioTimingSnapshot | null>();

const getAudioTimingsDir = () =>
  process.env.AUDIO_TIMINGS_DIR || join(process.cwd(), "app/data/audio-timings");

const pad3 = (value: number) => String(value).padStart(3, "0");

export const hasLocalAudioTimingReciter = (reciterId: string) =>
  localAudioTimingReciterSet.has(String(reciterId || "").trim());

const getAudioTimingPath = (reciterId: string, surahNumber: number) =>
  join(getAudioTimingsDir(), reciterId, `${pad3(surahNumber)}.json`);

export const getLocalChapterAudioTiming = async (
  reciterId: string,
  surahNumber: number
): Promise<ChapterAudioTimingSnapshot | null> => {
  if (!hasLocalAudioTimingReciter(reciterId)) return null;
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) return null;

  const cacheKey = `${reciterId}:${surahNumber}`;
  if (timingCache.has(cacheKey)) {
    return timingCache.get(cacheKey) || null;
  }

  const filePath = getAudioTimingPath(reciterId, surahNumber);
  if (!existsSync(filePath)) {
    timingCache.set(cacheKey, null);
    return null;
  }

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as ChapterAudioTimingSnapshot;
    timingCache.set(cacheKey, parsed);
    return parsed;
  } catch {
    timingCache.set(cacheKey, null);
    return null;
  }
};
