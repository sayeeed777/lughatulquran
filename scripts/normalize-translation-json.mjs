import { promises as fs } from "fs";
import { join } from "path";

const translationsDir = join(process.cwd(), "app/data/translations");

const parseLegacyTranslation = (rawValue) => {
  const raw = String(rawValue || "");
  if (!raw) return "";

  const tMatch = raw.match(
    /'t'\s*:\s*(?:'((?:[^'\\]|\\.|'')*?)'|"((?:[^"\\]|\\.)*?)")\s*[,}]/s
  );

  let text = tMatch ? String(tMatch[1] ?? tMatch[2] ?? "") : raw;

  text = text
    .replace(/''/g, "'")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, "\"")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");

  text = text.replace(/<sup\s+foot_note="[^"]*">\d+<\/sup>/gi, "");
  return text.trim();
};

const run = async () => {
  const entries = await fs.readdir(translationsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  let changedFiles = 0;
  let changedVerses = 0;

  for (const fileName of files) {
    const filePath = join(translationsDir, fileName);
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.surahs)) {
      continue;
    }

    let fileChanged = false;
    let fileVerseChanges = 0;

    for (const surah of parsed.surahs) {
      if (!surah || !Array.isArray(surah.verses)) continue;
      for (const verse of surah.verses) {
        const previous = String(verse?.translation ?? "");
        const normalized = parseLegacyTranslation(previous);
        if (normalized !== previous) {
          verse.translation = normalized;
          fileChanged = true;
          fileVerseChanges += 1;
        }
      }
    }

    if (fileChanged) {
      await fs.writeFile(filePath, JSON.stringify(parsed), "utf8");
      changedFiles += 1;
      changedVerses += fileVerseChanges;
      console.log(`normalized ${fileName}: ${fileVerseChanges} verses`);
    }
  }

  console.log(`done. files changed: ${changedFiles}, verses normalized: ${changedVerses}`);
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
