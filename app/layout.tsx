import "./styles/index.css";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getCspNonce } from "./lib/csp";

export const metadata: Metadata = {
  title: {
    default: "OpenFurqan — Read Quran Online with English Translations",
    template: "%s | OpenFurqan"
  },
  description:
    "Read the Quran online with authentic English translations by Arberry, Pickthall, Taqi Usmani, Yusuf Ali & Sahih International. Word-by-word analysis, audio recitation, prayer times & study tools.",
  metadataBase: new URL("https://openfurqan.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en": "/",
      "ar": "/",
      "x-default": "/"
    }
  },
  keywords: [
    "Quran", "Quran online", "read Quran", "Quran English translation",
    "Quran reader", "OpenFurqan", "Sahih International", "Yusuf Ali",
    "Pickthall", "Arberry", "Taqi Usmani", "word by word Quran",
    "Quran audio", "Quran recitation", "Islamic", "prayer times"
  ],
  authors: [{ name: "OpenFurqan", url: "https://openfurqan.com" }],
  creator: "OpenFurqan",
  publisher: "OpenFurqan",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://openfurqan.com",
    siteName: "OpenFurqan",
    title: "OpenFurqan — Read Quran Online with English Translations",
    description:
      "Read the Quran online with authentic English translations, word-by-word analysis, audio recitation, prayer times and study tools. Free and open source.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenFurqan — Read Quran Online with English Translations",
    description:
      "Read the Quran online with authentic English translations, word-by-word analysis, audio recitation & study tools.",
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon.svg", type: "image/svg+xml" }
    ],
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
  const nonce = await getCspNonce();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "OpenFurqan",
    url: "https://openfurqan.com",
    description:
      "Read the Quran online with authentic English translations, word-by-word analysis, audio recitation, prayer times and study tools.",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    featureList: [
      "Multiple English translations (Arberry, Pickthall, Taqi Usmani, Yusuf Ali, Sahih International)",
      "Word-by-word Arabic analysis",
      "Audio recitation by multiple reciters",
      "Prayer times",
      "Study mode with bookmarks and notes",
      "Dark and light themes",
      "Offline support"
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=JSON.parse(localStorage.getItem("quran_theme"));if(t==="light"||t==="bw"||t==="dark"||t==="bw-dark"){document.documentElement.dataset.theme=t}else{document.documentElement.dataset.theme=window.matchMedia("(prefers-color-scheme:light)").matches?"light":"dark"}}catch(e){document.documentElement.dataset.theme="dark"}})();`,
          }}
        />
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
