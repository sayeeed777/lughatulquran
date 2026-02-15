import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OpenFurqan — Modern Quran Reader";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
        {/* Book icon */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 64 64"
          fill="none"
          style={{ marginBottom: 32 }}
        >
          <path
            d="M12 18c6-3 14-4 20-4s14 1 20 4v28c-6-3-14-4-20-4s-14 1-20 4V18Z"
            stroke="#d8b36a"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M32 14v28"
            stroke="#d8b36a"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M20 24h12M20 32h12M20 40h12"
            stroke="#d8b36a"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

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
            color: "#d8b36a",
            letterSpacing: "0.02em",
            marginBottom: 24,
          }}
        >
          Read Quran Online with English Translations
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
          <span>5 Translations</span>
          <span style={{ color: "#4a5568" }}>·</span>
          <span>Word-by-Word</span>
          <span style={{ color: "#4a5568" }}>·</span>
          <span>Audio Recitation</span>
          <span style={{ color: "#4a5568" }}>·</span>
          <span>Prayer Times</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
