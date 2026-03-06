import { notFound } from "next/navigation";
import Link from "next/link";
import { SURAH_BY_SLUG, SURAHS, SURAH_BY_NUMBER } from "../../data/surahs";
import type { Metadata } from "next";
import { loadFirstVerseSeoText, loadSurahSeoText } from "../../lib/seoQuranText";
import { getCspNonce } from "../../lib/csp";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return SURAHS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
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

  return {
    title,
    description,
    alternates: {
      canonical: `/surah/${slug}`
    },
    openGraph: {
      title,
      description,
      url: `https://openfurqan.com/surah/${slug}`,
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

export default async function SurahPage({ params }: Props) {
  const nonce = await getCspNonce();
  const { slug } = await params;
  const surah = SURAH_BY_SLUG.get(slug);
  if (!surah) notFound();

  let surahText: Partial<Record<string, { ar: string; en: string }>> = {};
  try {
    surahText = await loadSurahSeoText(surah.number);
  } catch {
    surahText = {};
  }

  // Render all ayahs for stronger content depth and crawlability.
  const allVerses = [];
  for (let i = 1; i <= surah.ayahCount; i++) {
    const v = surahText[String(i)];
    if (v) allVerses.push({ num: i, ...v });
  }

  const prevSurah = surah.number > 1 ? SURAH_BY_NUMBER.get(surah.number - 1) : null;
  const nextSurah = surah.number < 114 ? SURAH_BY_NUMBER.get(surah.number + 1) : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://openfurqan.com" },
      { "@type": "ListItem", position: 2, name: `Surah ${surah.englishName}`, item: `https://openfurqan.com/surah/${slug}` }
    ]
  };

  const chapterJsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: `Surah ${surah.englishName}`,
    alternateName: surah.arabicName,
    description: `${surah.translation} — ${surah.ayahCount} ayahs, ${surah.revelationType} surah`,
    position: surah.number,
    url: `https://openfurqan.com/surah/${slug}`,
    datePublished: "2024-01-01",
    dateModified: "2026-02-16",
    isPartOf: {
      "@type": "Book",
      name: "The Holy Quran",
      url: "https://openfurqan.com"
    },
    inLanguage: ["ar", "en", "bn", "ur"],
    provider: {
      "@type": "WebApplication",
      name: "OpenFurqan",
      url: "https://openfurqan.com"
    }
  };

  return (
    <div className="seo-page">
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(chapterJsonLd) }} />

      <div className="seo-container">
        {/* Header */}
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

        {/* Full Surah Verses */}
        <section>
          {allVerses.map((v) => (
            <article key={v.num} className="seo-verse">
              <div className="seo-verse-ref">
                <Link href={`/surah/${slug}/${v.num}`}>{surah.number}:{v.num}</Link>
              </div>
              <p className="seo-verse-arabic">{v.ar}</p>
              <p className="seo-verse-english">{v.en}</p>
            </article>
          ))}
        </section>

        {/* CTA */}
        <div className="seo-cta-section">
          <Link href="/" className="seo-cta">
            Open in Reader &rarr;
          </Link>
        </div>

        {/* All Ayah Links */}
        <section>
          <h2 className="seo-ayah-links-title">
            All {surah.ayahCount} Ayahs
          </h2>
          <div className="seo-ayah-grid">
            {Array.from({ length: surah.ayahCount }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={`/surah/${slug}/${n}`} className="seo-ayah-link">
                {n}
              </Link>
            ))}
          </div>
        </section>

        {/* Navigation */}
        <nav className="seo-nav seo-nav-surah">
          {prevSurah ? (
            <Link href={`/surah/${prevSurah.slug}`}>
              &larr; {prevSurah.englishName}
            </Link>
          ) : (
            <span className="seo-nav-disabled">&nbsp;</span>
          )}

          <Link href="/">
            All Surahs
          </Link>

          {nextSurah ? (
            <Link href={`/surah/${nextSurah.slug}`}>
              {nextSurah.englishName} &rarr;
            </Link>
          ) : (
            <span className="seo-nav-disabled">&nbsp;</span>
          )}
        </nav>

        {/* Footer */}
        <footer className="seo-footer">
          <p>
            <Link href="/">OpenFurqan</Link> — Read the Quran with translations, audio & study tools.
            {" | "}<Link href="/about">About</Link>{" | "}<Link href="/faq">FAQ</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
