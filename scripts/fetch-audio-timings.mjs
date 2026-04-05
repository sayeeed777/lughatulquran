import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const RECITERS = {
  husary: 6,
  alafasy: 7
};
const KNOWN_TIMING_POSITION_FIXES = {
  "husary:38:1": [1, 2, 3, 4],
  "husary:50:1": [1, 2, 3]
};

const TOTAL_SURAHS = 114;
const OUTPUT_DIR = join(process.cwd(), "app/data/audio-timings");

const pad3 = (value) => String(value).padStart(3, "0");

const parseAyahFromVerseKey = (verseKey = "") => {
  const [, ayahRaw] = String(verseKey).split(":");
  const ayah = Number.parseInt(ayahRaw || "", 10);
  return Number.isInteger(ayah) && ayah > 0 ? ayah : null;
};

const normalizeAudioUrl = (audioUrl = "") => {
  if (!audioUrl) return null;
  if (/^https?:\/\//i.test(audioUrl)) return audioUrl;
  return `https://audio.qurancdn.com/${audioUrl.replace(/^\/+/, "")}`;
};

const normalizeSegments = (segments) => {
  if (!Array.isArray(segments)) return [];

  return segments
    .map((segment) => {
      if (!Array.isArray(segment) || segment.length < 3) return null;
      const position = Number(segment[0]);
      const fromMs = Number(segment[1]);
      const toMs = Number(segment[2]);

      if (
        !Number.isInteger(position)
        || position < 1
        || !Number.isFinite(fromMs)
        || !Number.isFinite(toMs)
        || toMs < fromMs
      ) {
        return null;
      }

      return { position, fromMs, toMs };
    })
    .filter(Boolean);
};

const applyKnownTimingPositionFix = (reciterId, surah, ayah, words) => {
  const expectedPositions = KNOWN_TIMING_POSITION_FIXES[`${reciterId}:${surah}:${ayah}`];
  if (!expectedPositions || expectedPositions.length !== words.length) {
    return words;
  }

  return words.map((word, index) => ({
    ...word,
    position: expectedPositions[index] ?? word.position
  }));
};

const normalizePayload = (reciterId, reciterApiId, surah, payload) => {
  const rawAudioUrl = normalizeAudioUrl(payload?.audio_file?.audio_url);
  const rawTimestamps = Array.isArray(payload?.audio_file?.timestamps) ? payload.audio_file.timestamps : [];

  if (!rawAudioUrl || !rawTimestamps.length) {
    throw new Error("Missing audio_url or timestamps.");
  }

  const timings = rawTimestamps
    .map((item) => {
      const ayah = parseAyahFromVerseKey(item?.verse_key);
      const fromMs = Number(item?.timestamp_from);
      const toMs = Number(item?.timestamp_to);

      if (
        !ayah
        || !Number.isFinite(fromMs)
        || !Number.isFinite(toMs)
        || toMs < fromMs
      ) {
        return null;
      }

      return {
        ayah,
        fromMs,
        toMs,
        words: applyKnownTimingPositionFix(
          reciterId,
          surah,
          ayah,
          normalizeSegments(item?.segments)
        )
      };
    })
    .filter(Boolean);

  if (!timings.length) {
    throw new Error("No valid verse timings found.");
  }

  return {
    reciterId,
    reciterApiId,
    surah,
    audioUrl: rawAudioUrl,
    timings,
    source: {
      provider: "quran.com",
      fetchedAt: new Date().toISOString()
    }
  };
};

const fetchChapterTiming = async (reciterApiId, surah) => {
  const response = await fetch(
    `https://api.quran.com/api/v4/chapter_recitations/${reciterApiId}/${surah}?segments=true`
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
};

const ensureDir = async (dirPath) => {
  await mkdir(dirPath, { recursive: true });
};

const main = async () => {
  await ensureDir(OUTPUT_DIR);

  for (const [reciterId, reciterApiId] of Object.entries(RECITERS)) {
    const reciterDir = join(OUTPUT_DIR, reciterId);
    await ensureDir(reciterDir);

    for (let surah = 1; surah <= TOTAL_SURAHS; surah += 1) {
      const payload = await fetchChapterTiming(reciterApiId, surah);
      const normalized = normalizePayload(reciterId, reciterApiId, surah, payload);
      const filePath = join(reciterDir, `${pad3(surah)}.json`);
      await writeFile(filePath, JSON.stringify(normalized));
      console.log(`saved ${reciterId} ${surah}`);
    }
  }

  console.log("done");
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
