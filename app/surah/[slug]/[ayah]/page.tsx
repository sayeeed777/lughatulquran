import { notFound } from "next/navigation";
import { SURAH_BY_SLUG, SURAHS } from "../../../data/surahs";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string; ayah: string }>;
};

export async function generateStaticParams() {
  const params: { slug: string; ayah: string }[] = [];
  for (const surah of SURAHS) {
    for (let a = 1; a <= surah.ayahCount; a++) {
      params.push({ slug: surah.slug, ayah: String(a) });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, ayah } = await params;
  const surah = SURAH_BY_SLUG.get(slug);
  const ayahNum = Number(ayah);
  if (!surah || !Number.isInteger(ayahNum) || ayahNum < 1 || ayahNum > surah.ayahCount) return {};

  const title = `Surah ${surah.englishName} Ayah ${ayahNum} — ${surah.translation} (${surah.number}:${ayahNum}) | OpenFurqan`;
  const description = `Read Surah ${surah.englishName} (${surah.arabicName}), Ayah ${ayahNum} with English translations. Verse ${surah.number}:${ayahNum} — word-by-word analysis, audio recitation & tafsir.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/surah/${slug}/${ayahNum}`,
      languages: { "en": `/surah/${slug}/${ayahNum}`, "ar": `/surah/${slug}/${ayahNum}`, "x-default": `/surah/${slug}/${ayahNum}` }
    },
    openGraph: {
      title,
      description,
      url: `https://openfurqan.com/surah/${slug}/${ayahNum}`,
      siteName: "OpenFurqan",
      type: "article"
    },
    twitter: {
      card: "summary",
      title: `${surah.englishName} ${surah.number}:${ayahNum}`,
      description
    }
  };
}

export default async function AyahPage({ params }: Props) {
  const { slug, ayah } = await params;
  const surah = SURAH_BY_SLUG.get(slug);
  const ayahNum = Number(ayah);
  if (!surah || !Number.isInteger(ayahNum) || ayahNum < 1 || ayahNum > surah.ayahCount) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://openfurqan.com" },
      { "@type": "ListItem", position: 2, name: `Surah ${surah!.englishName}`, item: `https://openfurqan.com/surah/${slug}` },
      { "@type": "ListItem", position: 3, name: `Ayah ${ayahNum}`, item: `https://openfurqan.com/surah/${slug}/${ayahNum}` }
    ]
  };

  const verseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Surah ${surah!.englishName} Ayah ${ayahNum} (${surah!.number}:${ayahNum})`,
    description: `Verse ${surah!.number}:${ayahNum} of Surah ${surah!.englishName} with English translations, word-by-word analysis, and audio recitation`,
    url: `https://openfurqan.com/surah/${slug}/${ayahNum}`,
    isPartOf: {
      "@type": "Chapter",
      name: `Surah ${surah!.englishName}`,
      url: `https://openfurqan.com/surah/${slug}`,
      position: surah!.number
    },
    inLanguage: ["ar", "en"],
    publisher: {
      "@type": "WebApplication",
      name: "OpenFurqan",
      url: "https://openfurqan.com"
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(verseJsonLd) }} />
      <meta httpEquiv="refresh" content={`0;url=/?surah=${surah!.number}&ayah=${ayahNum}`} />
      <p>Redirecting to Surah {surah!.englishName}, Ayah {ayahNum}...</p>
    </>
  );
}
