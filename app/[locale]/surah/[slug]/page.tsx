import { notFound } from "next/navigation";
import Link from "next/link";
import { SURAH_BY_SLUG, SURAH_BY_NUMBER } from "../../../data/surahs";
import type { Metadata } from "next";
import { loadFirstVerseSeoText, loadSurahSeoText } from "../../../lib/seoQuranText";
import { getCspNonce } from "../../../lib/csp";
import { isSupportedLocale, localeAlternateMap, withLocalePath } from "../../../lib/locales";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) return {};

  const surah = SURAH_BY_SLUG.get(slug);
  if (!surah) return {};

  let firstVerse: { ar: string; en: string } | null = null;
  try {
    firstVerse = await loadFirstVerseSeoText(surah.number);
  } catch {
    firstVerse = null;
  }
  const snippet = firstVerse?.en ? firstVerse.en.slice(0, 120) : "";

  const title = `Surah ${surah.englishName} (${surah.arabicName}) — ${surah.translation}`;
  const description = snippet
    ? `"${snippet}${firstVerse!.en.length > 120 ? "..." : ""}" — Read all ${surah.ayahCount} ayahs of Surah ${surah.englishName} with Arabic text, translations in English, Bangla & Urdu, audio & tafsir.`
    : `Read Surah ${surah.englishName} (${surah.translation}) with translations in English, Bangla & Urdu. ${surah.ayahCount} ayahs, ${surah.revelationType} surah. Sahih International, Yusuf Ali, Pickthall, Muhiuddin Khan & more.`;

  const path = `/surah/${slug}`;
  const canonicalPath = withLocalePath(locale, path);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: localeAlternateMap(path)
    },
    openGraph: {
      title,
      description,
      url: `https://openfurqan.com${canonicalPath}`,
      siteName: "OpenFurqan",
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title: `Surah ${surah.englishName} — ${surah.translation}`,
      description
    }
  };
}

export default async function LocaleSurahPage({ params }: Props) {
  const nonce = await getCspNonce();
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const surah = SURAH_BY_SLUG.get(slug);
  if (!surah) notFound();

  let surahText: Partial<Record<string, { ar: string; en: string }>> = {};
  try {
    surahText = await loadSurahSeoText(surah.number);
  } catch {
    surahText = {};
  }

  const allVerses = [];
  for (let i = 1; i <= surah.ayahCount; i++) {
    const verse = surahText[String(i)];
    if (verse) allVerses.push({ num: i, ...verse });
  }

  const prevSurah = surah.number > 1 ? SURAH_BY_NUMBER.get(surah.number - 1) : null;
  const nextSurah = surah.number < 114 ? SURAH_BY_NUMBER.get(surah.number + 1) : null;
  const localizedPath = (path: string) => withLocalePath(locale, path);
  const homePath = withLocalePath(locale, "/");

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `https://openfurqan.com${homePath}` },
      {
        "@type": "ListItem",
        position: 2,
        name: `Surah ${surah.englishName}`,
        item: `https://openfurqan.com${localizedPath(`/surah/${slug}`)}`
      }
    ]
  };

  const chapterJsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: `Surah ${surah.englishName}`,
    alternateName: surah.arabicName,
    description: `${surah.translation} — ${surah.ayahCount} ayahs, ${surah.revelationType} surah`,
    position: surah.number,
    url: `https://openfurqan.com${localizedPath(`/surah/${slug}`)}`,
    isPartOf: {
      "@type": "Book",
      name: "The Holy Quran",
      url: `https://openfurqan.com${homePath}`
    },
    inLanguage: ["ar", "en", "bn", "ur"],
    provider: {
      "@type": "WebApplication",
      name: "OpenFurqan",
      url: `https://openfurqan.com${homePath}`
    }
  };

  return (
    <div className="seo-page">
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(chapterJsonLd) }} />

      <div className="seo-container">
        <header className="seo-header">
          <div className="seo-surah-badge">
            <span>{surah.revelationType}</span>
            <span className="seo-meta-dot">&middot;</span>
            <span>Surah {surah.number}</span>
          </div>
          <h2 className="seo-arabic-title">{surah.arabicName}</h2>
          <h1 className="seo-english-title">Surah {surah.englishName}</h1>
          <p className="seo-translation">{surah.translation}</p>
          <div className="seo-meta">
            <span>{surah.ayahCount} Ayahs</span>
            <span className="seo-meta-dot">&middot;</span>
            <span>{surah.revelationType}</span>
          </div>
          <p className="seo-verse-english seo-context-copy">
            Surah {surah.englishName} is chapter {surah.number} of the Quran. This page shows the full surah text
            in Arabic with translation and links to every ayah for full reading, audio, and study tools.
          </p>
        </header>

        <section>
          {allVerses.map((verse) => (
            <article key={verse.num} className="seo-verse">
              <div className="seo-verse-ref">
                <Link href={localizedPath(`/surah/${slug}/${verse.num}`)}>{surah.number}:{verse.num}</Link>
              </div>
              <p className="seo-verse-arabic">{verse.ar}</p>
              <p className="seo-verse-english">{verse.en}</p>
            </article>
          ))}
        </section>

        <div className="seo-cta-section">
          <Link href={`${homePath}?surah=${surah.number}`} className="seo-cta">
            Read Full Surah with Audio &rarr;
          </Link>
        </div>

        <section>
          <h2 className="seo-ayah-links-title">
            All {surah.ayahCount} Ayahs
          </h2>
          <div className="seo-ayah-grid">
            {Array.from({ length: surah.ayahCount }, (_, index) => index + 1).map((ayahNum) => (
              <Link
                key={ayahNum}
                href={localizedPath(`/surah/${slug}/${ayahNum}`)}
                className="seo-ayah-link"
              >
                {ayahNum}
              </Link>
            ))}
          </div>
        </section>

        <nav className="seo-nav seo-nav-surah">
          {prevSurah ? (
            <Link href={localizedPath(`/surah/${prevSurah.slug}`)}>
              &larr; {prevSurah.englishName}
            </Link>
          ) : (
            <span className="seo-nav-disabled">&nbsp;</span>
          )}

          <Link href={homePath}>
            All Surahs
          </Link>

          {nextSurah ? (
            <Link href={localizedPath(`/surah/${nextSurah.slug}`)}>
              {nextSurah.englishName} &rarr;
            </Link>
          ) : (
            <span className="seo-nav-disabled">&nbsp;</span>
          )}
        </nav>

        <footer className="seo-footer">
          <p>
            <Link href={homePath}>OpenFurqan</Link> — Read the Quran with translations, audio & study tools.
          </p>
        </footer>
      </div>
    </div>
  );
}
