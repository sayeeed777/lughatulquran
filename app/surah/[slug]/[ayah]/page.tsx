import { notFound } from "next/navigation";
import Link from "next/link";
import { SURAH_BY_SLUG, SURAHS, SURAH_BY_NUMBER } from "../../../data/surahs";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string; ayah: string }>;
};

type QuranText = Record<string, Record<string, { ar: string; en: string }>>;

let quranText: QuranText | null = null;
function getQuranText(): QuranText {
  if (!quranText) {
    quranText = require("../../../data/quran-text.json") as QuranText;
  }
  return quranText;
}

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

  const text = getQuranText();
  const verse = text[String(surah.number)]?.[String(ayahNum)];
  const englishSnippet = verse?.en ? verse.en.slice(0, 160) : "";

  const title = `Surah ${surah.englishName} Ayah ${ayahNum} — ${surah.translation} (${surah.number}:${ayahNum}) | OpenFurqan`;
  const description = englishSnippet
    ? `"${englishSnippet}${verse!.en.length > 160 ? "..." : ""}" — Surah ${surah.englishName} (${surah.arabicName}), Verse ${surah.number}:${ayahNum}. Read with Arabic text, English translation & audio.`
    : `Read Surah ${surah.englishName} (${surah.arabicName}), Ayah ${ayahNum} with English translations. Verse ${surah.number}:${ayahNum} — word-by-word analysis, audio recitation & tafsir.`;

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
      card: "summary_large_image",
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

  const text = getQuranText();
  const verse = text[String(surah!.number)]?.[String(ayahNum)];

  const prevAyah = ayahNum > 1 ? ayahNum - 1 : null;
  const nextAyah = ayahNum < surah!.ayahCount ? ayahNum + 1 : null;

  // Find prev/next surah for boundary navigation
  const prevSurah = surah!.number > 1 ? SURAH_BY_NUMBER.get(surah!.number - 1) : null;
  const nextSurah = surah!.number < 114 ? SURAH_BY_NUMBER.get(surah!.number + 1) : null;

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
    description: `Verse ${surah!.number}:${ayahNum} of Surah ${surah!.englishName} with English translation`,
    articleBody: verse ? `${verse.ar}\n\n${verse.en}` : undefined,
    url: `https://openfurqan.com/surah/${slug}/${ayahNum}`,
    datePublished: "2025-06-01",
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
    <div className="seo-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(verseJsonLd) }} />

      <div className="seo-container">
        {/* Header */}
        <header className="seo-header">
          <div className="seo-surah-badge">
            <span>{surah!.revelationType}</span>
            <span className="seo-meta-dot">&middot;</span>
            <span>Surah {surah!.number}</span>
          </div>
          <h2 className="seo-arabic-title">{surah!.arabicName}</h2>
          <h1 className="seo-english-title">Surah {surah!.englishName} — Ayah {ayahNum}</h1>
          <p className="seo-translation">{surah!.translation}</p>
          <div className="seo-meta">
            <span>{surah!.ayahCount} Ayahs</span>
            <span className="seo-meta-dot">&middot;</span>
            <span>Verse {surah!.number}:{ayahNum}</span>
          </div>
        </header>

        {/* Verse Content */}
        {verse && (
          <article className="seo-verse">
            <div className="seo-verse-ref">
              {surah!.number}:{ayahNum}
            </div>
            <p className="seo-verse-arabic">{verse.ar}</p>
            <p className="seo-verse-english">{verse.en}</p>
          </article>
        )}

        {/* CTA */}
        <div className="seo-cta-section">
          <Link href={`/?surah=${surah!.number}&ayah=${ayahNum}`} className="seo-cta">
            Read with Audio & Tafsir &rarr;
          </Link>
        </div>

        {/* Navigation */}
        <nav className="seo-nav">
          {prevAyah ? (
            <Link href={`/surah/${slug}/${prevAyah}`}>
              &larr; Ayah {prevAyah}
            </Link>
          ) : prevSurah ? (
            <Link href={`/surah/${prevSurah.slug}/${prevSurah.ayahCount}`}>
              &larr; {prevSurah.englishName} {prevSurah.ayahCount}
            </Link>
          ) : (
            <span className="seo-nav-disabled">&nbsp;</span>
          )}

          <Link href={`/surah/${slug}`}>
            All Ayahs
          </Link>

          {nextAyah ? (
            <Link href={`/surah/${slug}/${nextAyah}`}>
              Ayah {nextAyah} &rarr;
            </Link>
          ) : nextSurah ? (
            <Link href={`/surah/${nextSurah.slug}/1`}>
              {nextSurah.englishName} 1 &rarr;
            </Link>
          ) : (
            <span className="seo-nav-disabled">&nbsp;</span>
          )}
        </nav>

        {/* Footer */}
        <footer className="seo-footer">
          <p>
            <Link href="/">OpenFurqan</Link> — Read the Quran with translations, audio & study tools.
          </p>
        </footer>
      </div>
    </div>
  );
}
