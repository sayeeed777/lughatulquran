import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist. Return to OpenFurqan to continue reading the Quran.",
  robots: { index: false, follow: true }
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a3b42 0%, #0b1c20 100%)",
        color: "#f2eee6",
        fontFamily: "system-ui, -apple-system, sans-serif",
        textAlign: "center",
        padding: "2rem"
      }}
    >
      <div style={{ fontSize: "5rem", fontWeight: 700, color: "#d8b36a", lineHeight: 1 }}>
        404
      </div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "1rem 0 0.5rem" }}>
        Page Not Found
      </h1>
      <p style={{ color: "#a8b0ba", maxWidth: 420, lineHeight: 1.6, margin: "0 0 2rem" }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            background: "rgba(216, 179, 106, 0.15)",
            color: "#d8b36a",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 600,
            border: "1px solid rgba(216, 179, 106, 0.25)",
            transition: "background 0.2s"
          }}
        >
          Read Quran
        </Link>
        <Link
          href="/surah/al-fatiha"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#f2eee6",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 500,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            transition: "background 0.2s"
          }}
        >
          Start with Al-Fatiha
        </Link>
      </div>
    </div>
  );
}
