#!/usr/bin/env node

import { execFile as execFileCb } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT_DIR = resolve(__dirname, "../app/data/root-explorer");
const DEFAULT_MORPHOLOGY_PATH = resolve(__dirname, "../app/data/quran-morphology.mustafa.txt");
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const execFile = promisify(execFileCb);

const BUCKWALTER_TO_ARABIC = {
  "'": "ء",
  "|": "آ",
  ">": "أ",
  "&": "ؤ",
  "<": "إ",
  "}": "ئ",
  A: "ا",
  b: "ب",
  p: "ة",
  t: "ت",
  v: "ث",
  j: "ج",
  H: "ح",
  x: "خ",
  d: "د",
  "*": "ذ",
  r: "ر",
  z: "ز",
  s: "س",
  $: "ش",
  S: "ص",
  D: "ض",
  T: "ط",
  Z: "ظ",
  E: "ع",
  g: "غ",
  f: "ف",
  q: "ق",
  k: "ك",
  l: "ل",
  m: "م",
  n: "ن",
  h: "ه",
  w: "و",
  Y: "ى",
  y: "ي"
};

const parseArgs = (argv) => {
  const args = {
    all: false,
    roots: [],
    limit: 0,
    delay: 120,
    force: false,
    refreshLex: false,
    morphologyPath: DEFAULT_MORPHOLOGY_PATH,
    outDir: DEFAULT_OUT_DIR
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--all") {
      args.all = true;
      continue;
    }
    if (token === "--root" && argv[index + 1]) {
      args.roots.push(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === "--limit" && argv[index + 1]) {
      args.limit = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === "--delay" && argv[index + 1]) {
      args.delay = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === "--force") {
      args.force = true;
      continue;
    }
    if (token === "--refresh-lex") {
      args.refreshLex = true;
      continue;
    }
    if (token === "--morphology" && argv[index + 1]) {
      args.morphologyPath = resolve(process.cwd(), argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === "--out-dir" && argv[index + 1]) {
      args.outDir = resolve(process.cwd(), argv[index + 1]);
      index += 1;
    }
  }

  if (!args.all && !args.roots.length) {
    throw new Error("Pass --all or at least one --root value.");
  }
  if (!Number.isInteger(args.delay) || args.delay < 0) {
    throw new Error("--delay must be a non-negative integer.");
  }
  if (!Number.isInteger(args.limit) || args.limit < 0) {
    throw new Error("--limit must be a non-negative integer.");
  }

  return args;
};

const buckwalterToArabic = (value = "") => {
  let out = "";
  for (const char of value) {
    out += BUCKWALTER_TO_ARABIC[char] ?? char;
  }
  return out;
};

const normalizeRootKey = (value = "") =>
  value
    .normalize("NFC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/\s+/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ؤئ]/g, "ء")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();

const normalizeQueryRoot = (value = "") => {
  const source = /[\u0600-\u06FF]/.test(value) ? value : buckwalterToArabic(value);
  return source
    .normalize("NFC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/\s+/g, "")
    .trim();
};

const normalizeRootValue = (value = "") => {
  return normalizeRootKey(normalizeQueryRoot(value));
};

const rootToFileSlug = (root) =>
  Array.from(normalizeRootValue(root))
    .map((char) => char.codePointAt(0)?.toString(16).padStart(4, "0") || "")
    .filter(Boolean)
    .join("-");

const toQuranhiveRoot = (root) => Array.from(normalizeQueryRoot(root)).join("-");

const getRootFilePath = (outDir, root) => resolve(outDir, `${rootToFileSlug(root)}.json`);

const collectRootsFromMorphology = (filePath) => {
  if (!existsSync(filePath)) {
    throw new Error(`Morphology file not found: ${filePath}`);
  }

  const text = readFileSync(filePath, "utf8");
  const roots = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/(?:^|\|)ROOT:([^|\t]+)/);
    if (!match) continue;
    const queryRoot = normalizeQueryRoot(match[1]);
    const normalized = normalizeRootValue(queryRoot);
    if (normalized && queryRoot && !roots.has(normalized)) {
      roots.set(normalized, queryRoot);
    }
  }
  return [...roots.values()].sort((a, b) => a.localeCompare(b, "ar"));
};

const fetchText = async (url, attempts = 3) => {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const { stdout } = await execFile("curl", ["-Ls", "--max-time", "40", url], {
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024
      });
      if (!stdout.trim()) {
        throw new Error(`Empty response for ${url}`);
      }
      return stdout;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(350 * attempt);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${url}`);
};

const fetchJson = async (url, attempts = 3) => {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const stdout = await fetchText(url, 1);
      return JSON.parse(stdout);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(400 * attempt);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch JSON for ${url}`);
};

const decodeHtmlEntities = (value = "") =>
  String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");

const sanitizeLexHtml = (value = "") =>
  decodeHtmlEntities(value)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?a\b[^>]*>/gi, "")
    .replace(/<(?!\/?(?:br|strong)\b)[^>]+>/gi, "")
    .replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .trim();

const stripMarkup = (value = "") =>
  String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseDerivedForms = (value = "") =>
  String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const extractMatch = (value, pattern) => {
  const match = value.match(pattern);
  return match?.[1]?.trim() || "";
};

const extractLexRequestConfig = (html) => {
  const qRef = extractMatch(html, /let q_ref = '([^']*)';/);
  const refword = extractMatch(html, /let refword = '([^']*)';/);
  const lexroot = extractMatch(html, /let lexroot = '([^']*)';/);
  const lexword = extractMatch(html, /let lexword = '([^']*)';/);

  if (!refword || !lexroot || !lexword) {
    return null;
  }

  return {
    qRef: qRef || "x",
    refword: refword.replace(/\.0$/g, ""),
    lexroot,
    lexword
  };
};

const extractLexEntries = (html) => {
  const entries = [];
  const regex = /<li\b([\s\S]*?)>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = regex.exec(html))) {
    const attrs = match[1] || "";
    if (!/id="wdef-/.test(attrs)) continue;

    const id = extractMatch(attrs, /id="([^"]+)"/);
    const className = extractMatch(attrs, /class="([^"]+)"/);
    const dataDef = extractMatch(attrs, /data-def="([^"]*)"/);
    const label = stripMarkup(match[2] || "");
    if (!label || !dataDef) continue;

    entries.push({
      id: decodeHtmlEntities(id || label),
      label,
      definitionHtml: sanitizeLexHtml(dataDef),
      isRoot: /\bw-root\b/.test(className),
      isMain: /\bw-main\b/.test(className)
    });
  }

  return entries;
};

const normalizeLexSnapshot = (html, config) => {
  const entries = extractLexEntries(html);
  const rootEntry = entries.find((entry) => entry.isRoot) || null;
  const mainEntry = entries.find((entry) => entry.isMain) || entries.find((entry) => !entry.isRoot) || null;
  const mainDefinitionHtml = sanitizeLexHtml(extractMatch(html, /<div id="main-def">([\s\S]*?)<\/div>/i));
  const wordGrammar = stripMarkup(extractMatch(html, /<a id="word-grammar">([\s\S]*?)<\/a>/i));
  const derivativeNote = stripMarkup(
    extractMatch(html, /<a id="word-to-deriv-mapping">([\s\S]*?)<\/a>/i)
  );

  if (!entries.length && !mainDefinitionHtml && !rootEntry?.definitionHtml) {
    return null;
  }

  return {
    wordGrammar: wordGrammar || null,
    derivativeNote: derivativeNote || null,
    rootDefinitionHtml: rootEntry?.definitionHtml || null,
    mainDefinitionHtml: mainDefinitionHtml || mainEntry?.definitionHtml || null,
    mainEntryId: mainEntry?.id || null,
    entries,
    source: {
      provider: "quranhive-lex-snapshot",
      fetchedAt: new Date().toISOString(),
      refword: config.refword,
      lexword: config.lexword
    }
  };
};

const groupSurahOccurrences = (rows) => {
  const grouped = new Map();
  for (const row of rows) {
    const surah = Number(row?.surah);
    if (!Number.isInteger(surah) || surah < 1) continue;
    const existing =
      grouped.get(surah) ||
      {
        surah,
        surahName: String(row?.chapname || surah),
        totalRootInSurah: Number(row?.total_root_in_surah) || 0,
        derivatives: []
      };

    existing.derivatives.push({
      form: String(row?.dict_word || "").trim(),
      count: Number(row?.occ) || 0,
      totalInQuran: Number(row?.total_deriv_in_quran) || 0
    });

    if (!existing.totalRootInSurah) {
      existing.totalRootInSurah = Number(row?.total_root_in_surah) || existing.derivatives
        .reduce((sum, derivative) => sum + derivative.count, 0);
    }

    grouped.set(surah, existing);
  }

  return [...grouped.values()]
    .map((item) => ({
      ...item,
      derivatives: item.derivatives.sort((a, b) => b.count - a.count || a.form.localeCompare(b.form, "ar"))
    }))
    .sort((a, b) => a.surah - b.surah);
};

const normalizeRootPayload = (root, derivPayload, surahPayload, ayahPayload) => {
  const derivativeRows = Array.isArray(derivPayload?.resp?.deriv_data) ? derivPayload.resp.deriv_data : [];
  const surahRows = Array.isArray(surahPayload?.resp?.surah_deriv_data)
    ? surahPayload.resp.surah_deriv_data
    : [];
  const ayahRows = Array.isArray(ayahPayload?.resp?.ayah_deriv_data)
    ? ayahPayload.resp.ayah_deriv_data
    : [];

  const derivatives = derivativeRows
    .map((row) => ({
      form: String(row?.dict_word || "").trim(),
      count: Number(row?.occurence) || 0
    }))
    .filter((item) => item.form && item.count > 0)
    .sort((a, b) => b.count - a.count || a.form.localeCompare(b.form, "ar"));

  const surahOccurrences = groupSurahOccurrences(surahRows);

  const ayahOccurrences = ayahRows
    .map((row) => ({
      surah: Number(row?.surah) || 0,
      ayah: Number(row?.ayah) || 0,
      text: stripMarkup(row?.ayah_all || ""),
      highlightedHtml: String(row?.ayah_all || "").trim(),
      derivedForms: parseDerivedForms(row?.derivs_found || "")
    }))
    .filter((item) => Number.isInteger(item.surah) && item.surah > 0 && Number.isInteger(item.ayah) && item.ayah > 0);

  const normalizedRoot = normalizeRootValue(root);

  return {
    root: normalizedRoot,
    rootArabic: normalizedRoot,
    stats: {
      totalOccurrences: Number(derivPayload?.total_occ_in_quran) || derivatives.reduce((sum, item) => sum + item.count, 0),
      derivativeCount: Number(derivPayload?.deriv_count) || derivatives.length,
      surahCount: surahOccurrences.length,
      ayahCount: ayahOccurrences.length
    },
    derivatives,
    surahOccurrences,
    ayahOccurrences,
    source: {
      provider: "quranhive-snapshot",
      fetchedAt: new Date().toISOString()
    }
  };
};

const fetchLexSnapshot = async (root) => {
  const rootPageUrl = `https://quranhive.com/surah/words/root/${encodeURIComponent(toQuranhiveRoot(root))}/`;
  const rootPageHtml = await fetchText(rootPageUrl);
  const requestConfig = extractLexRequestConfig(rootPageHtml);
  if (!requestConfig) {
    return null;
  }

  const params = new URLSearchParams({
    q_ref: requestConfig.qRef,
    lexroot: requestConfig.lexroot,
    lexword: requestConfig.lexword,
    refword: requestConfig.refword
  });

  const lexPayload = await fetchJson(`https://quranhive.com/surah/making/lex/?${params.toString()}`);
  const lexHtml = String(lexPayload?.takethis || "").trim();
  if (!lexHtml) {
    return null;
  }

  return normalizeLexSnapshot(lexHtml, requestConfig);
};

const fetchRootPayload = async (root) => {
  const encodedRoot = encodeURIComponent(toQuranhiveRoot(root));
  const baseUrl = "https://quranhive.com/surah/words/details/root";
  const [derivPayload, surahPayload, ayahPayload, lexSnapshot] = await Promise.all([
    fetchJson(`${baseUrl}/derivocc/?root=${encodedRoot}`),
    fetchJson(`${baseUrl}/surahocc/?root=${encodedRoot}`),
    fetchJson(`${baseUrl}/ayahocc/?root=${encodedRoot}`),
    fetchLexSnapshot(root)
  ]);

  return {
    ...normalizeRootPayload(root, derivPayload, surahPayload, ayahPayload),
    lexSnapshot
  };
};

const loadIndex = (outDir) => {
  const indexPath = resolve(outDir, "index.json");
  if (!existsSync(indexPath)) return {};
  try {
    return JSON.parse(readFileSync(indexPath, "utf8"));
  } catch {
    return {};
  }
};

const saveIndex = (outDir, payload) => {
  const indexPath = resolve(outDir, "index.json");
  writeFileSync(indexPath, JSON.stringify(payload, null, 2), "utf8");
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(args.outDir, { recursive: true });

  let roots = args.all ? collectRootsFromMorphology(args.morphologyPath) : args.roots.map(normalizeQueryRoot);
  roots = roots.filter(Boolean);
  if (args.limit > 0) {
    roots = roots.slice(0, args.limit);
  }

  const indexPayload = loadIndex(args.outDir);

  console.log(`Preparing root explorer snapshots for ${roots.length} roots...`);
  for (let index = 0; index < roots.length; index += 1) {
    const root = roots[index];
    const normalizedRoot = normalizeRootValue(root);
    const filePath = getRootFilePath(args.outDir, root);

    if (!args.force && existsSync(filePath)) {
      const existing = JSON.parse(readFileSync(filePath, "utf8"));
      const needsLexRefresh = args.refreshLex || !existing?.lexSnapshot;

      if (!needsLexRefresh) {
        process.stdout.write(`  [${index + 1}/${roots.length}] ${root} (cached)\n`);
        indexPayload[normalizedRoot] = {
          file: basename(filePath),
          totalOccurrences: existing?.stats?.totalOccurrences || 0,
          derivativeCount: existing?.stats?.derivativeCount || 0,
          surahCount: existing?.stats?.surahCount || 0,
          ayahCount: existing?.stats?.ayahCount || 0
        };
        continue;
      }

      process.stdout.write(`  [${index + 1}/${roots.length}] ${root} (adding lex snapshot)...`);
      try {
        const lexSnapshot = await fetchLexSnapshot(root);
        const payload = {
          ...existing,
          lexSnapshot
        };
        writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
        indexPayload[normalizedRoot] = {
          file: basename(filePath),
          totalOccurrences: payload?.stats?.totalOccurrences || 0,
          derivativeCount: payload?.stats?.derivativeCount || 0,
          surahCount: payload?.stats?.surahCount || 0,
          ayahCount: payload?.stats?.ayahCount || 0
        };
        console.log(" saved");
      } catch (error) {
        console.log(" failed");
        console.error(`    ${root}: ${error instanceof Error ? error.message : String(error)}`);
      }

      saveIndex(args.outDir, indexPayload);
      if (index < roots.length - 1 && args.delay > 0) {
        await sleep(args.delay);
      }
      continue;
    }

    process.stdout.write(`  [${index + 1}/${roots.length}] ${root}...`);
    try {
      const payload = await fetchRootPayload(root);
      writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
      indexPayload[normalizedRoot] = {
        file: basename(filePath),
        totalOccurrences: payload.stats.totalOccurrences,
        derivativeCount: payload.stats.derivativeCount,
        surahCount: payload.stats.surahCount,
        ayahCount: payload.stats.ayahCount
      };
      console.log(` saved (${payload.stats.totalOccurrences} occurrences)`);
    } catch (error) {
      console.log(` failed`);
      console.error(`    ${root}: ${error instanceof Error ? error.message : String(error)}`);
    }

    saveIndex(args.outDir, indexPayload);
    if (index < roots.length - 1 && args.delay > 0) {
      await sleep(args.delay);
    }
  }

  saveIndex(args.outDir, indexPayload);
  console.log(`Done. Snapshots saved to ${args.outDir}`);
};

run().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
