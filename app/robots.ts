import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/*?surah=", "/*?ayah=", "/*?surah=*&ayah="]
    },
    sitemap: "https://openfurqan.com/sitemap.xml"
  };
}
