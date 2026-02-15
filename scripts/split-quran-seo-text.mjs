#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, "../app/data/quran-text.json");
const TARGET_DIR = resolve(__dirname, "../app/data/quran-seo");

const toSurahFileName = (surahNumber) => `surah-${String(surahNumber).padStart(3, "0")}.json`;

const isVerse = (value) =>
  Boolean(
    value
      && typeof value === "object"
      && typeof value.ar === "string"
      && typeof value.en === "string"
  );

const main = () => {
  const raw = readFileSync(SOURCE, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("quran-text.json must be an object keyed by surah number.");
  }

  mkdirSync(TARGET_DIR, { recursive: true });

  let written = 0;
  for (const [surahKey, surahValue] of Object.entries(parsed)) {
    const surahNumber = Number(surahKey);
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      continue;
    }
    if (!surahValue || typeof surahValue !== "object" || Array.isArray(surahValue)) {
      continue;
    }

    const sanitized = {};
    for (const [ayahKey, verse] of Object.entries(surahValue)) {
      const ayahNumber = Number(ayahKey);
      if (!Number.isInteger(ayahNumber) || ayahNumber < 1) continue;
      if (!isVerse(verse)) continue;
      sanitized[String(ayahNumber)] = { ar: verse.ar, en: verse.en };
    }

    const outPath = resolve(TARGET_DIR, toSurahFileName(surahNumber));
    writeFileSync(outPath, JSON.stringify(sanitized));
    written += 1;
  }

  if (!written) {
    throw new Error("No surah files were written.");
  }

  console.log(`Wrote ${written} SEO surah files to ${TARGET_DIR}`);
};

try {
  main();
} catch (error) {
  console.error("Failed to split SEO Quran data:", error);
  process.exit(1);
}
