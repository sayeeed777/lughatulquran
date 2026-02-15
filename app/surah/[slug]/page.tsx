import { notFound } from "next/navigation";
import { SURAH_BY_SLUG, SURAHS } from "../../data/surahs";
import type { Metadata } from "next";

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

  const title = `Surah ${surah.englishName} (${surah.arabicName}) — ${surah.translation} | OpenFurqan`;
  const description = `Read Surah ${surah.englishName} (${surah.translation}) with English translations. ${surah.ayahCount} ayahs, ${surah.revelationType} surah. Multiple translations including Sahih International, Yusuf Ali, Pickthall & more.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/surah/${slug}`,
      languages: { "en": `/surah/${slug}`, "ar": `/surah/${slug}`, "x-default": `/surah/${slug}` }
    },
    openGraph: {
      title,
      description,
      url: `https://openfurqan.com/surah/${slug}`,
      siteName: "OpenFurqan",
      type: "article"
    },
    twitter: {
      card: "summary",
      title: `Surah ${surah.englishName} — ${surah.translation}`,
      description
    }
  };
}

export default async function SurahPage({ params }: Props) {
  const { slug } = await params;
  const surah = SURAH_BY_SLUG.get(slug);
  if (!surah) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://openfurqan.com" },
      { "@type": "ListItem", position: 2, name: `Surah ${surah.englishName}`, item: `https://openfurqan.com/surah/${slug}` }
    ]
  };

  const creativeWorkJsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: `Surah ${surah.englishName}`,
    alternateName: surah.arabicName,
    description: `${surah.translation} — ${surah.ayahCount} ayahs, ${surah.revelationType} surah`,
    position: surah.number,
    url: `https://openfurqan.com/surah/${slug}`,
    isPartOf: {
      "@type": "Book",
      name: "The Holy Quran",
      url: "https://openfurqan.com"
    },
    inLanguage: ["ar", "en"],
    provider: {
      "@type": "WebApplication",
      name: "OpenFurqan",
      url: "https://openfurqan.com"
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkJsonLd) }} />
      <meta httpEquiv="refresh" content={`0;url=/?surah=${surah.number}`} />
      <p>Redirecting to Surah {surah.englishName}...</p>
    </>
  );
}
