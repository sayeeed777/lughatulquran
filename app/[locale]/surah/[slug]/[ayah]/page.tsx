import { notFound } from "next/navigation";
import Link from "next/link";
import { SURAH_BY_SLUG, SURAH_BY_NUMBER } from "../../../../data/surahs";
import type { Metadata } from "next";
import { loadSurahSeoText, loadVerseSeoText } from "../../../../lib/seoQuranText";
import { getCspNonce } from "../../../../lib/csp";
import { isSupportedLocale, localeAlternateMap, withLocalePath } from "../../../../lib/locales";

type Props = {
  params: Promise<{ locale: string; slug: string; ayah: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, ayah } = await params;
  if (!isSupportedLocale(locale)) return {};

  const surah = SURAH_BY_SLUG.get(slug);
  const ayahNum = Number(ayah);
  if (!surah || !Number.isInteger(ayahNum) || ayahNum < 1 || ayahNum > surah.ayahCount) return {};

  let verse: { ar: string; en: string } | null = null;
  try {
    verse = await loadVerseSeoText(surah.number, ayahNum);
  } catch {
    verse = null;
  }
  const englishSnippet = verse?.en ? verse.en.slice(0, 160) : "";

  const title = `Surah ${surah.englishName} Ayah ${ayahNum} — ${surah.translation} (${surah.number}:${ayahNum})`;
  const description = englishSnippet
    ? `"${englishSnippet}${verse!.en.length > 160 ? "..." : ""}" — Surah ${surah.englishName} (${surah.arabicName}), Verse ${surah.number}:${ayahNum}. Read with Arabic text, translations in English, Bangla & Urdu, audio & tafsir.`
    : `Read Surah ${surah.englishName} (${surah.arabicName}), Ayah ${ayahNum} with translations in English, Bangla & Urdu. Verse ${surah.number}:${ayahNum} — word-by-word analysis, audio recitation & tafsir.`;

  const path = `/surah/${slug}/${ayahNum}`;
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
      title: `${surah.englishName} ${surah.number}:${ayahNum}`,
      description
    }
  };
}

export default async function LocaleAyahPage({ params }: Props) {
  const nonce = await getCspNonce();
  const { locale, slug, ayah } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const surah = SURAH_BY_SLUG.get(slug);
  const ayahNum = Number(ayah);
  if (!surah || !Number.isInteger(ayahNum) || ayahNum < 1 || ayahNum > surah.ayahCount) {
    notFound();
  }

  let surahText: Partial<Record<string, { ar: string; en: string }>> = {};
  try {
    surahText = await loadSurahSeoText(surah.number);
  } catch {
    surahText = {};
  }
  let verse: { ar: string; en: string } | null = surahText[String(ayahNum)] || null;
  if (!verse) {
    try {
      verse = await loadVerseSeoText(surah.number, ayahNum);
    } catch {
      verse = null;
    }
  }

  const nearbyVerses: Array<{ num: number; ar: string; en: string }> = [];
  const contextStart = Math.max(1, ayahNum - 2);
  const contextEnd = Math.min(surah.ayahCount, ayahNum + 2);
  for (let n = contextStart; n <= contextEnd; n++) {
    if (n === ayahNum) continue;
    const contextVerse = surahText[String(n)];
    if (!contextVerse) continue;
    nearbyVerses.push({ num: n, ...contextVerse });
  }

  const prevAyah = ayahNum > 1 ? ayahNum - 1 : null;
  const nextAyah = ayahNum < surah.ayahCount ? ayahNum + 1 : null;

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
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `Ayah ${ayahNum}`,
        item: `https://openfurqan.com${localizedPath(`/surah/${slug}/${ayahNum}`)}`
      }
    ]
  };

  const verseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Surah ${surah.englishName} Ayah ${ayahNum} (${surah.number}:${ayahNum})`,
    description: `Verse ${surah.number}:${ayahNum} of Surah ${surah.englishName} with translations in English, Bangla & Urdu`,
    articleBody: verse ? `${verse.ar}\n\n${verse.en}` : undefined,
    url: `https://openfurqan.com${localizedPath(`/surah/${slug}/${ayahNum}`)}`,
    isPartOf: {
      "@type": "Chapter",
      name: `Surah ${surah.englishName}`,
      url: `https://openfurqan.com${localizedPath(`/surah/${slug}`)}`,
      position: surah.number
    },
    inLanguage: ["ar", "en", "bn", "ur"],
    publisher: {
      "@type": "WebApplication",
      name: "OpenFurqan",
      url: `https://openfurqan.com${homePath}`
    }
  };

  return (
    <div className="seo-page">
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(verseJsonLd) }} />

      <div className="seo-container">
        <header className="seo-header">
          <div className="seo-surah-badge">
            <span>{surah.revelationType}</span>
            <span className="seo-meta-dot">&middot;</span>
            <span>Surah {surah.number}</span>
          </div>
          <h2 className="seo-arabic-title">{surah.arabicName}</h2>
          <h1 className="seo-english-title">Surah {surah.englishName} — Ayah {ayahNum}</h1>
          <p className="seo-translation">{surah.translation}</p>
          <div className="seo-meta">
            <span>{surah.ayahCount} Ayahs</span>
            <span className="seo-meta-dot">&middot;</span>
            <span>Verse {surah.number}:{ayahNum}</span>
          </div>
        </header>

        {verse && (
          <article className="seo-verse">
            <div className="seo-verse-ref">
              {surah.number}:{ayahNum}
            </div>
            <p className="seo-verse-arabic">{verse.ar}</p>
            <p className="seo-verse-english">{verse.en}</p>
          </article>
        )}
        {nearbyVerses.length > 0 && (
          <section className="seo-context-section" aria-labelledby="ayah-context-title">
            <h2 id="ayah-context-title" className="seo-context-title">
              Context in Surah {surah.englishName}
            </h2>
            <p className="seo-verse-english seo-context-copy">
              Nearby ayahs help place verse {surah.number}:{ayahNum} in sequence and meaning.
            </p>
            {nearbyVerses.map((contextVerse) => (
              <article key={contextVerse.num} className="seo-verse seo-verse-context">
                <div className="seo-verse-ref">
                  <Link href={localizedPath(`/surah/${slug}/${contextVerse.num}`)}>
                    {surah.number}:{contextVerse.num}
                  </Link>
                </div>
                <p className="seo-verse-arabic">{contextVerse.ar}</p>
                <p className="seo-verse-english">{contextVerse.en}</p>
              </article>
            ))}
          </section>
        )}

        <div className="seo-cta-section">
          <Link href={`${homePath}?surah=${surah.number}&ayah=${ayahNum}`} className="seo-cta">
            Read with Audio & Tafsir &rarr;
          </Link>
        </div>

        <nav className="seo-nav">
          {prevAyah ? (
            <Link href={localizedPath(`/surah/${slug}/${prevAyah}`)}>
              &larr; Ayah {prevAyah}
            </Link>
          ) : prevSurah ? (
            <Link href={localizedPath(`/surah/${prevSurah.slug}/${prevSurah.ayahCount}`)}>
              &larr; {prevSurah.englishName} {prevSurah.ayahCount}
            </Link>
          ) : (
            <span className="seo-nav-disabled">&nbsp;</span>
          )}

          <Link href={localizedPath(`/surah/${slug}`)}>
            All Ayahs
          </Link>

          {nextAyah ? (
            <Link href={localizedPath(`/surah/${slug}/${nextAyah}`)}>
              Ayah {nextAyah} &rarr;
            </Link>
          ) : nextSurah ? (
            <Link href={localizedPath(`/surah/${nextSurah.slug}/1`)}>
              {nextSurah.englishName} 1 &rarr;
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
