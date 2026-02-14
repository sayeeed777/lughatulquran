import "./styles/index.css";
import Script from "next/script";
import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "OpenFurqan — Read Quran Online with English Translations",
    template: "%s | OpenFurqan"
  },
  description:
    "Read the Quran online with authentic English translations by Arberry, Pickthall, Taqi Usmani, Yusuf Ali & Sahih International. Word-by-word analysis, audio recitation, prayer times & study tools.",
  metadataBase: new URL("https://openfurqan.com"),
  alternates: {
    canonical: "/"
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
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OpenFurqan — Modern Quran Reader"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenFurqan — Read Quran Online with English Translations",
    description:
      "Read the Quran online with authentic English translations, word-by-word analysis, audio recitation & study tools.",
    images: ["/og-image.png"]
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
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }
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
  const nonce =
    process.env.NODE_ENV === "production"
      ? (await headers()).get("x-nonce") || undefined
      : undefined;

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
    <html lang="en">
      {/* Meta tags are handled by the metadata and viewport exports above.
          No manual <head> tags needed — Next.js injects them automatically. */}
      <body>
        <script
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
