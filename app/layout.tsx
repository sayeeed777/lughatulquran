import "./styles/index.css";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getCspNonce } from "./lib/csp";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, normalizeLocale } from "./lib/locales";

export const metadata: Metadata = {
  title: {
    default: "OpenFurqan — Free Quran Reader & Study App",
    template: "%s | OpenFurqan"
  },
  description:
    "Free, open-source Quran reader and study app with Tafsir, Tajweed color-coding, word-by-word analysis, Hifz memorization, Lane's Lexicon, reading stats, and prayer times.",
  metadataBase: new URL("https://openfurqan.com"),
  alternates: {
    canonical: "/"
  },
  keywords: [
    "Quran", "Quran online", "read Quran", "Quran English translation",
    "Quran reader", "OpenFurqan", "Sahih International", "Yusuf Ali",
    "Pickthall", "Arberry", "Taqi Usmani", "word by word Quran",
    "Quran audio", "Quran recitation", "Islamic", "prayer times",
    "কুরআন", "কোরআন", "বাংলা অনুবাদ", "Quran Bangla translation",
    "Quran Bengali", "قرآن", "اردو ترجمہ", "Quran Urdu translation",
    "Bayan-ul-Quran", "Muhiuddin Khan"
  ],
  authors: [{ name: "OpenFurqan", url: "https://openfurqan.com" }],
  creator: "OpenFurqan",
  publisher: "OpenFurqan",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ar"],
    url: "https://openfurqan.com/",
    siteName: "OpenFurqan",
    title: "OpenFurqan — Free Quran Reader & Study App",
    description:
      "Free, open-source Quran reader and study app with Tafsir, Tajweed color-coding, word-by-word analysis, Hifz memorization, Lane's Lexicon, reading stats, and prayer times.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenFurqan — Free Quran Reader & Study App",
    description:
      "Free, open-source Quran reader and study app with Tafsir, Tajweed color-coding, word-by-word analysis, Hifz memorization, Lane's Lexicon, reading stats, and prayer times.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OpenFurqan"
  },
  formatDetection: {
    telephone: false
  },
  other: {
    google: "notranslate"
  },
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" }
    ],
    shortcut: [{ url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" }],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  category: "education"
};

export const viewport: Viewport = {
  themeColor: "#0b1c20",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const requestHeaders = await headers();
  const locale = normalizeLocale(requestHeaders.get("x-locale")) || DEFAULT_LOCALE;
  const nonce = await getCspNonce();
  const serviceWorkerVersion = process.env.NEXT_PUBLIC_APP_VERSION
    || process.env.VERCEL_GIT_COMMIT_SHA
    || process.env.VERCEL_DEPLOYMENT_ID
    || process.env.GITHUB_SHA
    || process.env.SOURCE_VERSION
    || "dev";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "OpenFurqan",
    url: "https://openfurqan.com",
    description:
      "Free, open-source Quran reader and study app with Tafsir, Tajweed color-coding, word-by-word analysis, Hifz memorization, Lane's Lexicon, reading stats, and prayer times.",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    datePublished: "2024-01-01",
    dateModified: "2026-03-06",
    inLanguage: ["ar", "en", "bn", "ur"],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    featureList: [
      "19 Quran translations in 9 languages",
      "9 audio reciters with adjustable playback speed",
      "Word-by-word Arabic analysis with roots and morphology",
      "16 color-coded Tajweed pronunciation rules",
      "7 Tafsir editions",
      "Study Mode with bookmarks, notes, and reading plans",
      "Hifz memorization mode with configurable repetition loops",
      "Arabic root lexicon with Lane's Lexicon definitions",
      "Prayer times with 11 calculation methods",
      "Reading statistics and streak tracking",
      "Surah, Juz, and Mushaf page reading modes",
      "4 visual themes",
      "Offline support as a Progressive Web App",
      "Customizable Arabic fonts and text sizes"
    ]
  };

  return (
    <html lang={locale} translate="no" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preconnect" href="https://verses.quran.foundation" crossOrigin="" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon-96x96.png" sizes="96x96" type="image/png" />
        <link rel="icon" href="/favicon-48x48.png" sizes="48x48" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <Script nonce={nonce} src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
        {process.env.NODE_ENV === "production" && (
          <Script
            nonce={nonce}
            src={`/sw-register.js?v=${encodeURIComponent(serviceWorkerVersion)}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
