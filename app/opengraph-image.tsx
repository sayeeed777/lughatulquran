import { ImageResponse } from "next/og";
import { headers } from "next/headers";

export const runtime = "edge";
export const alt = "OpenFurqan — Read and Study the Quran";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const requestHeaders = await headers();
  const requestHost = (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "")
    .split(",")[0]
    .trim();
  const isLocalHost = requestHost.startsWith("localhost:") || requestHost.startsWith("127.0.0.1:");
  const isTrustedHost = isLocalHost
    || requestHost === "openfurqan.com"
    || requestHost === "www.openfurqan.com"
    || requestHost.endsWith(".vercel.app");
  const brandOrigin = isTrustedHost
    ? `${isLocalHost ? "http" : "https"}://${requestHost}`
    : "https://openfurqan.com";
  const brandIcon = `${brandOrigin}/icons/openfurqan-app-v6-512.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a3b42 0%, #0b1c20 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <img
          src={brandIcon}
          alt=""
          width="120"
          height="120"
          style={{ marginBottom: 32, borderRadius: 28 }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#f2eee6",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          OpenFurqan
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#d8d5cd",
            letterSpacing: "0.02em",
            marginBottom: 24,
          }}
        >
          Read and study the Quran
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 32,
            fontSize: 18,
            color: "#a8b0ba",
          }}
        >
          <span>Root Meanings</span>
          <span style={{ color: "#4a5568" }}>·</span>
          <span>Lane’s Lexicon</span>
          <span style={{ color: "#4a5568" }}>·</span>
          <span>Tafsir</span>
          <span style={{ color: "#4a5568" }}>·</span>
          <span>Memorization</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
