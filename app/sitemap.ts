import type { MetadataRoute } from "next";
import { SURAHS } from "./data/surahs";

const BASE = "https://openfurqan.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0
    }
  ];

  for (const surah of SURAHS) {
    entries.push({
      url: `${BASE}/surah/${surah.slug}`,
      changeFrequency: "monthly",
      priority: 0.8
    });

    for (let ayah = 1; ayah <= surah.ayahCount; ayah++) {
      entries.push({
        url: `${BASE}/surah/${surah.slug}/${ayah}`,
        changeFrequency: "yearly",
        priority: 0.6
      });
    }
  }

  return entries;
}
