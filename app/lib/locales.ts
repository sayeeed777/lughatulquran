export const SUPPORTED_LOCALES = ["en", "bn", "ur"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "of_locale";

const URDU_TRANSLATION_IDS = new Set(["bayan-ul-quran"]);

const isEnglishLike = (value: string) => value.startsWith("en");
const isBanglaLike = (value: string) => value.startsWith("bn");
const isUrduLike = (value: string) => value.startsWith("ur");

export const isSupportedLocale = (value: string): value is AppLocale =>
  SUPPORTED_LOCALES.includes(value as AppLocale);

export const normalizeLocale = (value?: string | null): AppLocale | null => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (isBanglaLike(normalized)) return "bn";
  if (isUrduLike(normalized)) return "ur";
  if (isEnglishLike(normalized)) return "en";
  return null;
};

export const localeFromAcceptLanguage = (headerValue?: string | null): AppLocale => {
  const raw = String(headerValue || "").trim();
  if (!raw) return DEFAULT_LOCALE;

  const tags = raw.split(",").map((part) => part.split(";")[0]?.trim()).filter(Boolean);
  for (const tag of tags) {
    const locale = normalizeLocale(tag);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
};

export const translationIdToLocale = (translationId: string): AppLocale | null => {
  const normalized = String(translationId || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.startsWith("bn-")) return "bn";
  if (normalized.startsWith("ur-") || URDU_TRANSLATION_IDS.has(normalized)) return "ur";
  if (normalized.startsWith("en-")) return "en";
  return null;
};

export const localeFromTranslationIds = (translationIds: string[]): AppLocale => {
  let sawEnglish = false;
  let sawUrdu = false;

  for (const id of translationIds) {
    const locale = translationIdToLocale(id);
    if (!locale) continue;
    if (locale === "bn") return "bn";
    if (locale === "ur") sawUrdu = true;
    if (locale === "en") sawEnglish = true;
  }
  if (sawUrdu) return "ur";
  if (sawEnglish) return "en";
  return DEFAULT_LOCALE;
};

export const localeFromPathname = (pathname?: string | null): AppLocale | null => {
  const path = String(pathname || "").trim();
  if (!path) return null;

  const [, firstSegment] = path.split("/");
  if (!firstSegment) return null;
  return isSupportedLocale(firstSegment) ? firstSegment : null;
};

export const withLocalePath = (locale: AppLocale, path = "/") => {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return safePath;
  if (safePath === "/") return `/${locale}`;
  return `/${locale}${safePath}`;
};

export const defaultTranslationForLocale = (locale: AppLocale): string => {
  if (locale === "bn") return "bn-bengali";
  if (locale === "ur") return "ur-kanzuliman";
  return "en-arberry";
};

export const localeAlternateMap = (
  path: string,
  base = "https://openfurqan.com"
): Record<string, string> => ({
  en: `${base}${withLocalePath("en", path)}`,
  bn: `${base}${withLocalePath("bn", path)}`,
  ur: `${base}${withLocalePath("ur", path)}`,
  "x-default": `${base}${withLocalePath(DEFAULT_LOCALE, path)}`
});
