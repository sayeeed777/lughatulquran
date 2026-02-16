import type { MetadataRoute } from "next";
import { SURAHS } from "./data/surahs";

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

export async function generateSitemaps() {
  const chunks = Math.ceil(SURAHS.length / AYAH_CHUNK_SIZE);
  // id 0 = surah index pages, ids 1+ = ayah page chunks
  return Array.from({ length: chunks + 1 }, (_, i) => ({ id: i }));
}

export default function sitemap({ id }: { id: number }): MetadataRoute.Sitemap {
  // Sitemap 0: homepage + all surah pages
  if (id === 0) {
    return [
      {
        url: BASE,
        lastModified: LAST_MODIFIED,
        changeFrequency: "weekly",
        priority: 1.0
      },
      ...SURAHS.map((surah) => {
        const surahUrl = `${BASE}/surah/${surah.slug}`;
        return {
          url: surahUrl,
          lastModified: LAST_MODIFIED,
          changeFrequency: "yearly" as const,
          priority: 0.8
        };
      })
    ];
  }

  // Sitemaps 1+: ayah pages chunked by surah groups
  const chunkIndex = id - 1;
  const start = chunkIndex * AYAH_CHUNK_SIZE;
  const chunk = SURAHS.slice(start, start + AYAH_CHUNK_SIZE);

  const entries: MetadataRoute.Sitemap = [];
  for (const surah of chunk) {
    for (let ayah = 1; ayah <= surah.ayahCount; ayah++) {
      const ayahUrl = `${BASE}/surah/${surah.slug}/${ayah}`;
      entries.push({
        url: ayahUrl,
        lastModified: LAST_MODIFIED,
        changeFrequency: "yearly",
        priority: 0.5
      });
    }
  }

  return entries;
}
