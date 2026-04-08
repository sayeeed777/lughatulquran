#!/usr/bin/env node
/**
 * Fetches Arabic (Uthmani) + Sahih International for all 114 surahs
 * and saves to app/data/quran-text.json for static page generation.
 *
 * Usage: node scripts/fetch-quran-data.mjs
 */

import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../app/data/quran-text.json");
const WORDS_OUT = resolve(__dirname, "../app/data/quran-words.json");
const SEO_OUT_DIR = resolve(__dirname, "../app/data/quran-seo");

const QDC = "https://api.quran.com/api/v4";
const ALQURAN = "https://api.alquran.cloud/v1";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetches verses + words for a surah in one pass. Returns both the verse-level
// data (arabic / tajweed / page) that feeds quran-text.json and the word-level
// data ({a, t, tr, p}) that feeds quran-words.json.
async function fetchSurahFromQdc(surahNum) {
  const verses = [];
  const wordsByAyah = {};
  let page = 1;
  let hasNext = true;
  while (hasNext) {
    // Keep the richer word-level text for word highlighting, but keep the verse-level
    // display text from QDC's verse field so card-style ayah text does not inherit the
    // extra low-meem pronunciation marker.
    const url = `${QDC}/verses/by_chapter/${surahNum}?language=en&words=true&word_fields=text_uthmani,char_type_name,translation,transliteration&translation_fields=text&fields=text_uthmani,text_uthmani_tajweed,page_number&page=${page}&per_page=50`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Arabic fetch failed for surah ${surahNum} page ${page}`);
    const data = await res.json();
    for (const v of data.verses || []) {
      const wordList = (v.words || []).filter((w) => w.char_type_name === "word");

      const wordsForAyah = wordList
        .map((w) => {
          const a = w.text_uthmani || "";
          if (!a) return null;
          const t = w?.translation?.text || "";
          const tr = w?.transliteration?.text || "";
          const p = w.position || 0;
          const entry = { a, p };
          if (t) entry.t = t;
          if (tr) entry.tr = tr;
          return entry;
        })
        .filter(Boolean)
        .sort((x, y) => (x.p || 0) - (y.p || 0));

      if (wordsForAyah.length) {
        wordsByAyah[v.verse_number] = wordsForAyah;
      }

      verses.push({
        n: v.verse_number,
        ar: v.text_uthmani || "",
        tj: v.text_uthmani_tajweed || null,
        pg: v.page_number || null,
      });
    }
    hasNext = !!data.pagination?.next_page;
    page = data.pagination?.next_page || page + 1;
  }
  return { verses, wordsByAyah };
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
  const wordsResult = {};
  console.log("Fetching Quran data for 114 surahs...\n");

  for (let s = 1; s <= 114; s++) {
    process.stdout.write(`  Surah ${s}/114...`);
    const [qdc, sahih] = await Promise.all([fetchSurahFromQdc(s), fetchSahih(s)]);
    const { verses: arabic, wordsByAyah } = qdc;

    const surahData = {};
    for (const v of arabic) {
      const en = sahih.find((e) => e.n === v.n);
      surahData[v.n] = {
        ar: v.ar,
        en: en?.en || "",
        tj: v.tj || null,
        pg: v.pg || null,
      };
    }
    result[s] = surahData;
    wordsResult[s] = wordsByAyah;

    const totalWords = Object.values(wordsByAyah).reduce((sum, arr) => sum + arr.length, 0);
    console.log(` ${arabic.length} ayahs, ${totalWords} words`);

    // Rate limit: small delay between surahs
    if (s < 114) await sleep(200);
  }

  writeFileSync(OUT, JSON.stringify(result));
  writeFileSync(WORDS_OUT, JSON.stringify(wordsResult));

  mkdirSync(SEO_OUT_DIR, { recursive: true });
  for (const [surahKey, surahData] of Object.entries(result)) {
    const padded = String(Number(surahKey)).padStart(3, "0");
    writeFileSync(resolve(SEO_OUT_DIR, `surah-${padded}.json`), JSON.stringify(surahData));
  }

  const sizeMB = (Buffer.byteLength(JSON.stringify(result)) / 1024 / 1024).toFixed(2);
  const wordsSizeMB = (Buffer.byteLength(JSON.stringify(wordsResult)) / 1024 / 1024).toFixed(2);
  console.log(`\nDone! Saved to ${OUT} (${sizeMB} MB)`);
  console.log(`Saved word-by-word to ${WORDS_OUT} (${wordsSizeMB} MB)`);
  console.log(`Also wrote split SEO files to ${SEO_OUT_DIR}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
