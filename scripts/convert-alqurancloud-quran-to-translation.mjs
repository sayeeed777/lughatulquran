#!/usr/bin/env node
/**
 * Convert an AlQuran.cloud "quran" response JSON into the local translation JSON format
 * used by app/lib/translationLoader.ts.
 *
 * Input expected shape (from e.g. https://api.alquran.cloud/v1/quran/bn.bengali):
 *   { data: { surahs: [ { number, ayahs: [ { numberInSurah, text } ] } ] } }
 *
 * Usage:
 *   node scripts/convert-alqurancloud-quran-to-translation.mjs \
 *     --in /path/to/bn.bengali.json \
 *     --outId bn-bengali \
 *     --out app/data/translations/bn-bengali.json \
 *     --source "AlQuran.cloud (bn.bengali)"
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

function getArg(name) {
  const idx = process.argv.findIndex((x) => x === `--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const inputPath = getArg("in");
const outId = (getArg("outId") || "").trim();
const outPathArg = getArg("out");
const source = (getArg("source") || "").trim() || "AlQuran.cloud";

if (!inputPath) {
  console.error("Missing --in");
  process.exit(1);
}
if (!outId) {
  console.error("Missing --outId (e.g. bn-bengali)");
  process.exit(1);
}

const outPath = resolve(process.cwd(), outPathArg || `app/data/translations/${outId}.json`);
mkdirSync(dirname(outPath), { recursive: true });

const raw = readFileSync(resolve(process.cwd(), inputPath), "utf8");
const payload = JSON.parse(raw);
const surahsIn = payload?.data?.surahs;

if (!Array.isArray(surahsIn) || surahsIn.length !== 114) {
  console.error("Input doesn't look like a full Quran response (data.surahs length != 114).");
  process.exit(1);
}

const surahs = [];
let totalVerses = 0;
const missing = [];

for (const s of surahsIn) {
  const surahNumber = Number(s?.number);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) continue;

  const verses = [];
  const ayahs = Array.isArray(s?.ayahs) ? s.ayahs : [];
  for (const a of ayahs) {
    const id = Number(a?.numberInSurah);
    const rawText = typeof a?.text === "string" ? a.text : "";
    const text = rawText.replace(/\uFEFF/gu, "").trim();
    if (!Number.isInteger(id) || id < 1) continue;
    if (!text) {
      missing.push(`${surahNumber}:${id}`);
      continue;
    }
    verses.push({ id, translation: text });
  }

  totalVerses += verses.length;
  surahs.push({ id: surahNumber, total_verses: verses.length, verses });
}

surahs.sort((a, b) => a.id - b.id);

const file = {
  translator: outId,
  source,
  surahs,
  meta: {
    total_verses: totalVerses,
    missing_count: missing.length,
    missing_sample: missing.slice(0, 24)
  }
};

writeFileSync(outPath, JSON.stringify(file));
const sizeMB = (Buffer.byteLength(JSON.stringify(file)) / 1024 / 1024).toFixed(2);
console.log(`Wrote ${outPath} (${sizeMB} MB). Missing: ${missing.length}`);

