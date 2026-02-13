import "./styles/index.css";
import Script from "next/script";
import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Quran Reader",
  description:
    "A modern Quran reader with authentic English translations (Arberry, Pickthall, Taqi Usmani, Yusuf Ali, Sahih International).",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quran Reader"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }
    ]
  }
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

  return (
    <html lang="en">
      {/* Meta tags are handled by the metadata and viewport exports above.
          No manual <head> tags needed — Next.js injects them automatically. */}
      <body>
        {children}
        {process.env.NODE_ENV === "production" && (
          <Script nonce={nonce} src="/sw-register.js" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
