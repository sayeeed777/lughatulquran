import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const OUTPUT_PATH = path.resolve("app/data/prayerLocationsSupplemental.json");
const LOCAL_DUMP_DIRS = [
  process.env.GEONAMES_DUMP_DIR,
  "/tmp/geonames-prayer"
].filter(Boolean);

const COUNTRIES = [
  {
    code: "BD",
    country: "Bangladesh",
    strategy: "districts"
  },
  {
    code: "PK",
    country: "Pakistan",
    strategy: "cities",
    minPopulation: 5000,
    includeAdm1: true
  },
  {
    code: "GB",
    country: "United Kingdom",
    strategy: "cities",
    minPopulation: 5000
  },
  {
    code: "US",
    country: "United States",
    strategy: "cities",
    minPopulation: 5000
  }
];

const parseRow = (line) => {
  const cols = line.split("\t");
  if (cols.length < 18) return null;
  const geonameId = Number(cols[0]);
  const city = String(cols[1] || "").trim();
  const latitude = Number(cols[4]);
  const longitude = Number(cols[5]);
  const featureClass = String(cols[6] || "");
  const featureCode = String(cols[7] || "");
  const countryCode = String(cols[8] || "");
  const population = Number(cols[14] || 0);
  const timezone = String(cols[17] || "").trim();

  if (!Number.isFinite(geonameId)) return null;
  if (!city || !timezone) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    geonameId,
    city,
    latitude,
    longitude,
    featureClass,
    featureCode,
    countryCode,
    population,
    timezone
  };
};

const keepRow = (row, countryConfig) => {
  if (!row || row.countryCode !== countryConfig.code) return false;
  if (countryConfig.includeAdm1 && row.featureClass === "A" && row.featureCode === "ADM1") {
    return true;
  }
  if (countryConfig.strategy === "districts") {
    return row.featureClass === "A" && row.featureCode === "ADM2";
  }
  if (countryConfig.strategy === "cities") {
    return (
      row.featureClass === "P"
      && row.population >= (countryConfig.minPopulation ?? 0)
    );
  }
  return false;
};

const fetchAndExtract = async (code, workspaceDir) => {
  for (const dumpDir of LOCAL_DUMP_DIRS) {
    const localTxtPath = path.join(dumpDir, `${code}.txt`);
    try {
      await access(localTxtPath);
      return readFile(localTxtPath, "utf8");
    } catch {
      // Try next local source.
    }
  }

  const zipPath = path.join(workspaceDir, `${code}.zip`);
  const txtPath = path.join(workspaceDir, `${code}.txt`);
  const url = `https://download.geonames.org/export/dump/${code}.zip`;

  await execFileAsync("curl", ["-L", "--silent", "-o", zipPath, url]);
  await execFileAsync("unzip", ["-o", "-q", zipPath], { cwd: workspaceDir });
  return readFile(txtPath, "utf8");
};

const build = async () => {
  const workspaceDir = await mkdtemp(path.join(tmpdir(), "prayer-locations-"));
  try {
    const combined = [];
    for (const country of COUNTRIES) {
      const content = await fetchAndExtract(country.code, workspaceDir);
      const lines = content.split("\n");
      let kept = 0;
      for (const line of lines) {
        if (!line) continue;
        const row = parseRow(line);
        if (!keepRow(row, country)) continue;
        combined.push({
          countryCode: country.code,
          country: country.country,
          city: row.city,
          latitude: row.latitude,
          longitude: row.longitude,
          timezone: row.timezone,
          geonameId: row.geonameId
        });
        kept += 1;
      }
      console.log(`${country.code}: ${kept} entries`);
    }

    const dedupedMap = new Map();
    for (const item of combined) {
      const key = item.geonameId
        ? `gid:${item.geonameId}`
        : `${item.countryCode}:${item.city.toLowerCase()}:${item.latitude}:${item.longitude}`;
      if (!dedupedMap.has(key)) {
        dedupedMap.set(key, item);
      }
    }

    const deduped = Array.from(dedupedMap.values()).sort((a, b) => {
      if (a.countryCode !== b.countryCode) return a.countryCode.localeCompare(b.countryCode);
      return a.city.localeCompare(b.city);
    });

    await writeFile(OUTPUT_PATH, `${JSON.stringify(deduped, null, 2)}\n`, "utf8");
    console.log(`Wrote ${deduped.length} entries to ${OUTPUT_PATH}`);
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
};

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
