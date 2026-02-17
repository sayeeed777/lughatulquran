import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const usage = () => {
  console.error(
    "Usage: node scripts/convert-tafsir-map-to-translation.mjs <input.json> <output.json> <translator-id> [source]"
  );
};

const decodeEntities = (text) => {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'");
};

const normalizeText = (text) => {
  if (!text) return "";
  return decodeEntities(
    String(text)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/\uFFFD+/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
};

const main = async () => {
  const [, , inputArg, outputArg, translatorArg, sourceArg] = process.argv;
  if (!inputArg || !outputArg || !translatorArg) {
    usage();
    process.exit(1);
  }

  const inputPath = resolve(inputArg);
  const outputPath = resolve(outputArg);
  const translator = String(translatorArg).trim();
  const source = String(sourceArg || "my quran api (converted)").trim();

  const raw = await readFile(inputPath, "utf-8");
  const map = JSON.parse(raw);
  if (!map || typeof map !== "object" || Array.isArray(map)) {
    throw new Error("Input JSON must be an object keyed by 'surah:ayah'.");
  }

  const bySurah = new Map();
  let totalEntries = 0;

  for (const [key, value] of Object.entries(map)) {
    const match = /^(\d+):(\d+)$/.exec(key);
    if (!match) continue;
    const surah = Number(match[1]);
    const ayah = Number(match[2]);
    if (!Number.isInteger(surah) || surah < 1 || !Number.isInteger(ayah) || ayah < 1) {
      continue;
    }
    const rawText = typeof value === "string" ? value : value?.text;
    const translation = normalizeText(rawText);
    if (!translation) continue;

    let verses = bySurah.get(surah);
    if (!verses) {
      verses = new Map();
      bySurah.set(surah, verses);
    }
    verses.set(ayah, translation);
    totalEntries += 1;
  }

  const surahs = [...bySurah.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([surahNumber, verses]) => {
      const sortedVerses = [...verses.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([ayahNumber, translation]) => ({
          id: ayahNumber,
          translation
        }));

      const maxAyah = sortedVerses.length
        ? sortedVerses[sortedVerses.length - 1].id
        : 0;

      return {
        id: surahNumber,
        total_verses: maxAyah,
        verses: sortedVerses
      };
    });

  const output = {
    translator,
    source,
    surahs
  };

  await writeFile(outputPath, JSON.stringify(output), "utf-8");

  console.log(`Converted ${totalEntries} ayahs across ${surahs.length} surahs.`);
  console.log(`Output: ${outputPath}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
