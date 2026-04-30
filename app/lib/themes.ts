export const DEFAULT_THEME = "dark";
export const LEGACY_THEME_ALIASES = {
  ocean: "mist",
} as const;

export const THEMES = [
  {
    id: "dark",
    label: "Dark",
    scheme: "dark",
    swatch: ["#0e1418", "#1b242c", "#6fd4b1"],
    cssFile: "app/styles/themes/dark.css",
  },
  {
    id: "light",
    label: "Parchment",
    scheme: "light",
    swatch: ["#e8ded1", "#f0e7db", "#425236"],
    cssFile: "app/styles/themes/light.css",
  },
  {
    id: "bw",
    label: "Black & White",
    scheme: "light",
    swatch: ["#ffffff", "#f5f5f5", "#111111"],
    cssFile: "app/styles/themes/bw.css",
  },
  {
    id: "bw-dark",
    label: "Dark B&W",
    scheme: "dark",
    swatch: ["#000000", "#111111", "#ffffff"],
    cssFile: "app/styles/themes/bw-dark.css",
  },
  {
    id: "mist",
    label: "Mist",
    scheme: "dark",
    swatch: ["#263d42", "#2a4247", "#8fb299"],
    cssFile: "app/styles/themes/mist.css",
  },
  {
    id: "sky",
    label: "Sky",
    scheme: "light",
    swatch: ["#b8d4e4", "#dbeaf2", "#1b6b80"],
    cssFile: "app/styles/themes/sky.css",
  },
] as const;

export type ThemeName = (typeof THEMES)[number]["id"];

const THEME_IDS = new Set<string>(THEMES.map((theme) => theme.id));

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && THEME_IDS.has(value);
}

export function normalizeThemeName(value: unknown): ThemeName | null {
  if (isThemeName(value)) return value;
  if (typeof value !== "string") return null;
  const alias = LEGACY_THEME_ALIASES[value as keyof typeof LEGACY_THEME_ALIASES];
  return alias ?? null;
}

export function isLightThemeName(theme: ThemeName): boolean {
  return THEMES.find((item) => item.id === theme)?.scheme === "light";
}
