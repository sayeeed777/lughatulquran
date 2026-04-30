import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredThemeTokens = [
  "--bg-deep",
  "--bg-mid",
  "--bg-light",
  "--card",
  "--card-strong",
  "--text",
  "--muted",
  "--accent",
  "--accent-2",
  "--accent-contrast",
  "--stroke",
  "--compare-row-divider",
  "--shadow",
  "--shadow-card",
  "--shadow-elevated",
  "--gradient-primary",
  "--reader-card-bg",
  "--reader-card-bg-hover",
  "--reader-card-bg-focused",
  "--reader-card-bg-active",
  "--reader-card-shadow-hover",
  "--reader-action-bg",
  "--reader-action-bg-hover",
  "--reader-action-bg-active",
  "--reader-action-text",
  "--reader-action-primary-bg",
  "--reader-action-primary-bg-hover",
  "--reader-action-primary-text",
  "--reader-action-danger-text",
  "--reader-action-danger-bg-hover",
  "--reader-control-stop-bg",
  "--reader-control-stop-bg-hover",
  "--reader-control-stop-text",
  "--reader-control-play-bg",
  "--reader-control-play-bg-hover",
  "--reader-control-play-text",
  "--control-danger-bg",
  "--control-danger-bg-hover",
  "--control-danger-text",
  "--field-bg",
  "--field-bg-hover",
  "--field-bg-focus",
  "--focus-ring",
  "--segmented-active-bg",
  "--segmented-active-text",
  "--share-primary-bg",
  "--share-primary-bg-hover",
  "--share-primary-text",
  "--share-primary-shadow",
  "--share-primary-shadow-hover",
  "--study-ayah-card-bg",
  "--study-ayah-card-bg-hover",
  "--study-ayah-card-shadow",
  "--study-ayah-card-playing-bg",
  "--study-ayah-card-marked-bg",
  "--study-ayah-card-marked-hover-bg",
  "--study-ayah-card-marked-playing-bg",
  "--study-ayah-card-marked-shadow",
  "--study-word-hover-bg",
  "--study-word-active-bg",
  "--study-word-active-text",
  "--study-rail-bg",
  "--study-rail-border",
  "--study-rail-shadow",
  "--study-rail-button-bg",
  "--study-rail-button-bg-hover",
  "--study-rail-button-active-bg",
  "--study-rail-button-active-text",
  "--study-primary-control-bg",
  "--study-primary-control-bg-hover",
  "--study-primary-control-text",
  "--quick-panel-bg",
  "--quick-panel-border",
  "--quick-panel-shadow",
];

const readProjectFile = (filePath) => readFile(path.join(rootDir, filePath), "utf8");

const extractThemes = (source) => {
  const themeBlocks = [...source.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?cssFile:\s*"([^"]+)"/g)];
  return themeBlocks.map((match) => ({ id: match[1], cssFile: match[2] }));
};

const extractImportedThemeFiles = (source) => {
  const imports = [...source.matchAll(/@import\s+"\.\/themes\/([^"]+\.css)"/g)];
  return new Set(imports.map((match) => `app/styles/themes/${match[1]}`));
};

const extractPublicInitThemes = (source) => {
  const validThemesMatch = source.match(/validThemes\s*=\s*new Set\(\[([^\]]+)\]\)/);
  if (!validThemesMatch) return null;
  return new Set([...validThemesMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]));
};

const failures = [];

const registrySource = await readProjectFile("app/lib/themes.ts");
const themes = extractThemes(registrySource);

if (themes.length === 0) {
  failures.push("No themes found in app/lib/themes.ts.");
}

const ids = new Set();
for (const theme of themes) {
  if (ids.has(theme.id)) {
    failures.push(`Duplicate theme id in registry: ${theme.id}`);
  }
  ids.add(theme.id);
}

const imports = extractImportedThemeFiles(await readProjectFile("app/styles/themes.css"));
const publicInitThemes = extractPublicInitThemes(await readProjectFile("public/theme-init.js"));

for (const theme of themes) {
  if (!imports.has(theme.cssFile)) {
    failures.push(`${theme.id}: ${theme.cssFile} is not imported by app/styles/themes.css.`);
  }

  const css = await readProjectFile(theme.cssFile).catch((error) => {
    failures.push(`${theme.id}: cannot read ${theme.cssFile}: ${error.message}`);
    return "";
  });

  if (!css.includes(`:root[data-theme="${theme.id}"]`)) {
    failures.push(`${theme.id}: missing :root[data-theme="${theme.id}"] block in ${theme.cssFile}.`);
  }

  for (const token of requiredThemeTokens) {
    const tokenPattern = new RegExp(`${token.replace(/-/g, "\\-")}\\s*:`);
    if (!tokenPattern.test(css)) {
      failures.push(`${theme.id}: missing required token ${token} in ${theme.cssFile}.`);
    }
  }
}

if (!publicInitThemes) {
  failures.push("public/theme-init.js does not expose a validThemes Set.");
} else {
  for (const theme of themes) {
    if (!publicInitThemes.has(theme.id)) {
      failures.push(`${theme.id}: missing from public/theme-init.js validThemes.`);
    }
  }
  for (const theme of publicInitThemes) {
    if (!ids.has(theme)) {
      failures.push(`${theme}: present in public/theme-init.js but missing from app/lib/themes.ts.`);
    }
  }
}

if (failures.length) {
  console.error("Theme contract check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Theme contract OK: ${themes.length} themes, ${requiredThemeTokens.length} required tokens each.`);
