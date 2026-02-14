import { notFound, redirect } from "next/navigation";
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
      canonical: `/surah/${slug}/${ayahNum}`
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
  redirect(`/?surah=${surah!.number}&ayah=${ayahNum}`);
}
