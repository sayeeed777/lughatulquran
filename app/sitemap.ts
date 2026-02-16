import type { MetadataRoute } from "next";
import { SURAHS } from "./data/surahs";
import {
  DEFAULT_LOCALE,
  localeAlternateMap,
  SUPPORTED_LOCALES,
  withLocalePath
} from "./lib/locales";

const BASE = "https://openfurqan.com";
// Update this only when canonical Quran SEO content changes.
const LAST_MODIFIED = new Date("2026-02-16");

/**
 * Generates a sitemap index with one sitemap per group:
 *   /sitemap/0.xml — homepage + all 114 surah pages
 *   /sitemap/1.xml — ayah pages for surahs 1-38
 *   /sitemap/2.xml — ayah pages for surahs 39-76
 *   /sitemap/3.xml — ayah pages for surahs 77-114
 */
const AYAH_CHUNK_SIZE = 38; // ~2,000 URLs per chunk

const toAbsoluteUrl = (locale: (typeof SUPPORTED_LOCALES)[number], path: string) =>
  `${BASE}${withLocalePath(locale, path)}`;

export async function generateSitemaps() {
  const chunks = Math.ceil(SURAHS.length / AYAH_CHUNK_SIZE);
  // id 0 = surah index pages, ids 1+ = ayah page chunks
  return Array.from({ length: chunks + 1 }, (_, i) => ({ id: i }));
}

const toSitemapId = (value: number | string) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
};

export default async function sitemap(
  { id }: { id: Promise<number> | number | string }
): Promise<MetadataRoute.Sitemap> {
  const sitemapId = toSitemapId(await Promise.resolve(id));

  // Sitemap 0: locale homepages + all locale-prefixed surah pages
  if (sitemapId === 0) {
    return [
      ...SUPPORTED_LOCALES.map((locale) => ({
        url: toAbsoluteUrl(locale, "/"),
        lastModified: LAST_MODIFIED,
        changeFrequency: "monthly" as const,
        priority: locale === DEFAULT_LOCALE ? 1.0 : 0.8,
        alternates: {
          languages: localeAlternateMap("/")
        }
      })),
      ...SURAHS.flatMap((surah) =>
        SUPPORTED_LOCALES.map((locale) => {
          const path = `/surah/${surah.slug}`;
          return {
            url: toAbsoluteUrl(locale, path),
            lastModified: LAST_MODIFIED,
            changeFrequency: "yearly" as const,
            priority: locale === DEFAULT_LOCALE ? 0.8 : 0.6,
            alternates: {
              languages: localeAlternateMap(path)
            }
          };
        })
      )
    ];
  }

  // Sitemaps 1+: locale-prefixed ayah pages chunked by surah groups
  const chunkIndex = sitemapId - 1;
  const start = chunkIndex * AYAH_CHUNK_SIZE;
  const chunk = SURAHS.slice(start, start + AYAH_CHUNK_SIZE);

  const entries: MetadataRoute.Sitemap = [];
  for (const surah of chunk) {
    for (let ayah = 1; ayah <= surah.ayahCount; ayah++) {
      const path = `/surah/${surah.slug}/${ayah}`;
      for (const locale of SUPPORTED_LOCALES) {
        entries.push({
          url: toAbsoluteUrl(locale, path),
          lastModified: LAST_MODIFIED,
          changeFrequency: "yearly",
          priority: locale === DEFAULT_LOCALE ? 0.5 : 0.4,
          alternates: {
            languages: localeAlternateMap(path)
          }
        });
      }
    }
  }

  return entries;
}
