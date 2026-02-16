import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Home from "../page";
import {
  isSupportedLocale,
  localeAlternateMap,
  SUPPORTED_LOCALES,
  withLocalePath
} from "../lib/locales";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};

  const canonicalPath = withLocalePath(locale, "/");
  return {
    alternates: {
      canonical: canonicalPath,
      languages: localeAlternateMap("/")
    },
    openGraph: {
      url: `https://openfurqan.com${canonicalPath}`
    }
  };
}

export default async function LocaleHomePage({ params }: Props) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <Home />;
}
