#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../app/data/quran-metadata-page.json");
const QDC = "https://api.quran.com/api/v4";
const TOTAL_PAGES = 604;

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

const toRange = (numbers) => {
  if (!numbers.length) return "";
  const start = numbers[0];
  const end = numbers[numbers.length - 1];
  return start === end ? String(start) : `${start}-${end}`;
};

const buildVerseMapping = (verses) => {
  const bySurah = new Map();

  for (const verse of verses) {
    const [surahPart, ayahPart] = String(verse.verse_key || "").split(":");
    const surah = Number(surahPart);
    const ayah = Number(ayahPart);
    if (!Number.isInteger(surah) || !Number.isInteger(ayah)) continue;

    const list = bySurah.get(surah) || [];
    list.push(ayah);
    bySurah.set(surah, list);
  }

  return Object.fromEntries(
    Array.from(bySurah.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([surah, ayahs]) => {
        const sortedAyahs = [...new Set(ayahs)].sort((a, b) => a - b);
        return [String(surah), toRange(sortedAyahs)];
      })
  );
};

const fetchPage = async (pageNumber) => {
  const url = new URL(`${QDC}/verses/by_page/${pageNumber}`);
  url.searchParams.set("language", "en");
  url.searchParams.set("words", "false");
  url.searchParams.set(
    "fields",
    "verse_key,page_number,juz_number,hizb_number,rub_el_hizb_number,manzil_number,ruku_number"
  );
  url.searchParams.set("per_page", "50");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch page ${pageNumber}: ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload?.verses) ? payload.verses : [];
};

const run = async () => {
  const result = {};

  console.log(`Fetching page metadata for ${TOTAL_PAGES} mushaf pages...\n`);

  for (let page = 1; page <= TOTAL_PAGES; page += 1) {
    process.stdout.write(`  Page ${page}/${TOTAL_PAGES}...`);
    const verses = await fetchPage(page);

    if (!verses.length) {
      throw new Error(`No verses returned for page ${page}`);
    }

    result[String(page)] = {
      page_number: page,
      verses_count: verses.length,
      first_verse_key: verses[0].verse_key,
      last_verse_key: verses[verses.length - 1].verse_key,
      verse_mapping: buildVerseMapping(verses)
    };

    console.log(` ${verses.length} verses`);
    if (page < TOTAL_PAGES) await sleep(80);
  }

  mkdirSync(resolve(__dirname, "../app/data"), { recursive: true });
  writeFileSync(OUT, JSON.stringify(result), "utf8");

  const sizeKb = (Buffer.byteLength(JSON.stringify(result)) / 1024).toFixed(1);
  console.log(`\nDone. Saved ${OUT} (${sizeKb} KB)`);
};

run().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
