#!/usr/bin/env node
/**
 * Fetches Arabic (Uthmani) + Sahih International for all 114 surahs
 * and saves to app/data/quran-text.json for static page generation.
 *
 * Usage: node scripts/fetch-quran-data.mjs
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../app/data/quran-text.json");

const QDC = "https://api.quran.com/api/v4";
const ALQURAN = "https://api.alquran.cloud/v1";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchArabic(surahNum) {
  const verses = [];
  let page = 1;
  let hasNext = true;
  while (hasNext) {
    const url = `${QDC}/verses/by_chapter/${surahNum}?language=en&words=false&fields=text_uthmani&page=${page}&per_page=50`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Arabic fetch failed for surah ${surahNum} page ${page}`);
    const data = await res.json();
    for (const v of data.verses || []) {
      verses.push({ n: v.verse_number, ar: v.text_uthmani });
    }
    hasNext = !!data.pagination?.next_page;
    page = data.pagination?.next_page || page + 1;
  }
  return verses;
}

async function fetchSahih(surahNum) {
  const res = await fetch(`${ALQURAN}/surah/${surahNum}/en.sahih`);
  if (!res.ok) throw new Error(`Sahih fetch failed for surah ${surahNum}`);
  const data = await res.json();
  return (data.data?.ayahs || []).map((a) => ({
    n: a.numberInSurah,
    en: a.text,
  }));
}

async function main() {
  const result = {};
  console.log("Fetching Quran data for 114 surahs...\n");

  for (let s = 1; s <= 114; s++) {
    process.stdout.write(`  Surah ${s}/114...`);
    const [arabic, sahih] = await Promise.all([fetchArabic(s), fetchSahih(s)]);

    const surahData = {};
    for (const v of arabic) {
      const en = sahih.find((e) => e.n === v.n);
      surahData[v.n] = { ar: v.ar, en: en?.en || "" };
    }
    result[s] = surahData;
    console.log(` ${arabic.length} ayahs`);

    // Rate limit: small delay between surahs
    if (s < 114) await sleep(200);
  }

  writeFileSync(OUT, JSON.stringify(result));
  const sizeMB = (Buffer.byteLength(JSON.stringify(result)) / 1024 / 1024).toFixed(2);
  console.log(`\nDone! Saved to ${OUT} (${sizeMB} MB)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
