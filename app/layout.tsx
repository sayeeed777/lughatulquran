import "./styles/index.css";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getCspNonce } from "./lib/csp";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, localeAlternateMap, normalizeLocale } from "./lib/locales";

export const metadata: Metadata = {
  title: {
    default: "OpenFurqan — Read Quran Online with Translations in English, Bangla & Urdu",
    template: "%s | OpenFurqan"
  },
  description:
    "Read the Quran online with Arabic text and translations in English, Bangla, and Urdu. Audio recitation, word-by-word study, prayer times, and notes.",
  metadataBase: new URL("https://openfurqan.com"),
  alternates: {
    canonical: "/",
    languages: localeAlternateMap("/")
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
    alternateLocale: ["ar", "bn_BD", "ur_PK"],
    url: "https://openfurqan.com/",
    siteName: "OpenFurqan",
    title: "OpenFurqan — Read Quran Online with Translations in English, Bangla & Urdu",
    description:
      "Read the Quran online with translations in English, Bangla & Urdu. Word-by-word analysis, audio recitation, prayer times and study tools. Free and open source.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenFurqan — Read Quran Online with Translations in English, Bangla & Urdu",
    description:
      "Read the Quran online with translations in English, Bangla & Urdu. Word-by-word analysis, audio recitation & study tools.",
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "OpenFurqan",
    url: "https://openfurqan.com",
    description:
      "Read the Quran online with translations in English, Bangla & Urdu. Word-by-word analysis, audio recitation, prayer times and study tools.",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    inLanguage: ["en", "ar", "bn", "ur"],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    featureList: [
      "Multiple English translations (Arberry, Pickthall, Taqi Usmani, Yusuf Ali, Sahih International, Haleem, Muhsin Khan)",
      "Bangla translation (Muhiuddin Khan)",
      "Urdu translation (Bayan-ul-Quran)",
      "Word-by-word Arabic analysis",
      "Audio recitation by multiple reciters",
      "Prayer times",
      "Study mode with bookmarks and notes",
      "Dark and light themes",
      "Offline support"
    ]
  };

  return (
    <html lang={locale} translate="no" suppressHydrationWarning>
      <head>
        <Script nonce={nonce} src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        {process.env.NODE_ENV === "production" && (
          <Script nonce={nonce} src="/sw-register.js" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
