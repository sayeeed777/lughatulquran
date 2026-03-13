#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT_DIR = resolve(__dirname, "../app/data/quran-page-layouts");
const QDC = "https://api.quran.com/api/v4";
const TOTAL_PAGES = 604;
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

const parseArgs = (argv) => {
  const args = {
    all: false,
    page: 1,
    from: 1,
    to: TOTAL_PAGES,
    delay: 80,
    input: "",
    outDir: DEFAULT_OUT_DIR,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--all") {
      args.all = true;
      continue;
    }
    if (token === "--page" && argv[index + 1]) {
      args.page = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === "--from" && argv[index + 1]) {
      args.from = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === "--to" && argv[index + 1]) {
      args.to = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === "--delay" && argv[index + 1]) {
      args.delay = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === "--input" && argv[index + 1]) {
      args.input = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--out-dir" && argv[index + 1]) {
      args.outDir = resolve(process.cwd(), argv[index + 1]);
      index += 1;
      continue;
    }
  }

  if (!Number.isInteger(args.page) || args.page < 1 || args.page > TOTAL_PAGES) {
    throw new Error("Page must be an integer between 1 and 604.");
  }
  if (!Number.isInteger(args.from) || args.from < 1 || args.from > TOTAL_PAGES) {
    throw new Error("From page must be an integer between 1 and 604.");
  }
  if (!Number.isInteger(args.to) || args.to < 1 || args.to > TOTAL_PAGES) {
    throw new Error("To page must be an integer between 1 and 604.");
  }
  if (args.from > args.to) {
    throw new Error("From page cannot be greater than to page.");
  }
  if (!Number.isInteger(args.delay) || args.delay < 0) {
    throw new Error("Delay must be a non-negative integer.");
  }
  if (args.all && args.input) {
    throw new Error("--all cannot be combined with --input.");
  }

  return args;
};

const parseVerseKey = (value) => {
  const [surahPart, ayahPart] = String(value || "").split(":");
  return {
    surahNumber: Number(surahPart),
    ayahNumber: Number(ayahPart),
  };
};

const fetchRawPage = async (pageNumber) => {
  const url = new URL(`${QDC}/verses/by_page/${pageNumber}`);
  url.searchParams.set("mushaf", "1");
  url.searchParams.set("words", "true");
  url.searchParams.set("per_page", "50");
  url.searchParams.set("word_fields", "code_v2,text_qpc_hafs,line_number,page_number,position,verse_key");
  url.searchParams.set("fields", "verse_key,verse_number,page_number,juz_number");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch page ${pageNumber}: ${response.status}`);
  }

  return response.json();
};

const normalizePage = (payload, pageNumber) => {
  const verses = Array.isArray(payload?.verses) ? payload.verses : [];
  if (!verses.length) {
    throw new Error(`No verses returned for page ${pageNumber}.`);
  }

  const lines = new Map();
  const verseKeys = [];
  const surahs = new Set();

  for (const verse of verses) {
    const verseKey = String(verse?.verse_key || "");
    if (!verseKey) continue;

    verseKeys.push(verseKey);
    const { surahNumber, ayahNumber } = parseVerseKey(verseKey);
    if (Number.isInteger(surahNumber) && surahNumber > 0) {
      surahs.add(surahNumber);
    }

    const words = Array.isArray(verse?.words) ? verse.words : [];
    for (const word of words) {
      const lineNumber = Number(word?.line_number);
      if (!Number.isInteger(lineNumber) || lineNumber < 1) continue;

      const list = lines.get(lineNumber) || [];
      list.push({
        type: word?.char_type_name === "end" ? "marker" : "word",
        verseKey,
        surahNumber,
        ayahNumber,
        position: Number.isInteger(word?.position) ? word.position : null,
        glyph: String(word?.code_v2 || "").trim(),
        text: String(word?.text_qpc_hafs || word?.text || "").trim(),
      });
      lines.set(lineNumber, list);
    }
  }

  return {
    pageNumber,
    mushaf: "qcf_v2",
    firstVerseKey: verseKeys[0],
    lastVerseKey: verseKeys[verseKeys.length - 1],
    versesCount: verseKeys.length,
    surahs: [...surahs].sort((a, b) => a - b),
    lines: [...lines.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([lineNumber, segments]) => ({
        lineNumber,
        segments,
      })),
  };
};

const savePageLayout = async ({ page, input, outDir }) => {
  const rawPayload = input
    ? JSON.parse(readFileSync(resolve(process.cwd(), input), "utf8"))
    : await fetchRawPage(page);
  const normalized = normalizePage(rawPayload, page);
  mkdirSync(outDir, { recursive: true });

  const fileName = `page-${String(page).padStart(3, "0")}.json`;
  const outPath = resolve(outDir, fileName);
  writeFileSync(outPath, JSON.stringify(normalized), "utf8");
  return normalized;
};

const run = async () => {
  const { all, page, from, to, delay, input, outDir } = parseArgs(process.argv.slice(2));

  if (!all) {
    const normalized = await savePageLayout({ page, input, outDir });
    const outPath = resolve(outDir, `page-${String(page).padStart(3, "0")}.json`);
    console.log(`Saved ${outPath}`);
    console.log(
      `Page ${page}: ${normalized.versesCount} verses, ${normalized.lines.length} lines, surahs ${normalized.surahs.join(", ")}`
    );
    return;
  }

  console.log(`Fetching mushaf page layouts ${from}-${to}...`);
  for (let currentPage = from; currentPage <= to; currentPage += 1) {
    process.stdout.write(`  Page ${currentPage}/${to}...`);
    const normalized = await savePageLayout({ page: currentPage, input: "", outDir });
    console.log(
      ` ${normalized.versesCount} verses, ${normalized.lines.length} lines`
    );
    if (currentPage < to && delay > 0) {
      await sleep(delay);
    }
  }

  console.log(`Done. Saved page layouts to ${outDir}`);
};

run().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
