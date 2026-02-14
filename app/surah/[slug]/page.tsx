import { notFound, redirect } from "next/navigation";
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
  redirect(`/?surah=${surah.number}`);
}
