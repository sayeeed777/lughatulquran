"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Ayah } from "../../lib/types";
import { normalizeQuranDisplayArabic } from "../../lib/utils";
import { SURAH_BY_NUMBER } from "../../data/surahs";

type SharePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  ayah: Ayah | null;
  surahNumber: number;
  surahName: string;
  surahNameArabic: string;
  selectedTranslation: string;
};

const SOCIAL_LINKS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    getUrl: (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    id: "x",
    label: "X",
    color: "#000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    getUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    getUrl: (text: string, url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    color: "#0088cc",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    getUrl: (text: string, url: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
];

function generateAyahImage(
  arabic: string,
  translation: string,
  reference: string,
  surahNameArabic: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas not supported"));

    const width = 1080;
    const padding = 80;

    // --- Measure content height first using a temp canvas ---
    const arabicFontSize = arabic.length > 200 ? 36 : arabic.length > 100 ? 42 : 48;
    const translationFontSize = translation.length > 300 ? 22 : translation.length > 150 ? 26 : 30;
    const arabicLineHeight = arabicFontSize * 2.2;
    const translationLineHeight = translationFontSize * 1.8;

    // Measure Arabic lines
    ctx.font = `${arabicFontSize}px "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif`;
    const arabicLines = wrapText(ctx, arabic, width - padding * 2);

    // Measure translation lines
    ctx.font = `italic ${translationFontSize}px -apple-system, "Segoe UI", sans-serif`;
    const translationLines = wrapText(ctx, translation, width - padding * 2);

    // Calculate dynamic height
    const topPadding = 100;       // top to surah name
    const surahToArabicGap = 100; // gap between surah name and arabic text
    const arabicBlockHeight = arabicLines.length * arabicLineHeight;
    const arabicToTranslationGap = 25; // space between arabic and translation
    const translationBlockHeight = translationLines.length * translationLineHeight;
    const refHeight = 50;         // reference line below translation
    const bottomSection = 100;    // openfurqan.com + bottom padding

    const contentHeight = topPadding + surahToArabicGap + arabicBlockHeight + arabicToTranslationGap + translationBlockHeight + refHeight + bottomSection;
    // Minimum 1080 (square), cap at 1350 for Instagram story compatibility
    const height = Math.min(1350, Math.max(1080, contentHeight));

    canvas.width = width;
    canvas.height = height;

    // --- Draw everything ---

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0e1418");
    bg.addColorStop(0.5, "#141c22");
    bg.addColorStop(1, "#0e1418");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle decorative border
    ctx.strokeStyle = "rgba(111, 212, 177, 0.15)";
    ctx.lineWidth = 2;
    const borderInset = 40;
    ctx.roundRect(borderInset, borderInset, width - borderInset * 2, height - borderInset * 2, 20);
    ctx.stroke();

    // Corner ornaments
    ctx.strokeStyle = "rgba(216, 179, 106, 0.3)";
    ctx.lineWidth = 1.5;
    const ornLen = 40;
    const ornInset = 55;
    ctx.beginPath();
    ctx.moveTo(ornInset, ornInset + ornLen);
    ctx.lineTo(ornInset, ornInset);
    ctx.lineTo(ornInset + ornLen, ornInset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - ornInset - ornLen, ornInset);
    ctx.lineTo(width - ornInset, ornInset);
    ctx.lineTo(width - ornInset, ornInset + ornLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ornInset, height - ornInset - ornLen);
    ctx.lineTo(ornInset, height - ornInset);
    ctx.lineTo(ornInset + ornLen, height - ornInset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - ornInset - ornLen, height - ornInset);
    ctx.lineTo(width - ornInset, height - ornInset);
    ctx.lineTo(width - ornInset, height - ornInset - ornLen);
    ctx.stroke();

    // Vertically center the content block
    const totalContentHeight = surahToArabicGap + arabicBlockHeight + arabicToTranslationGap + translationBlockHeight + refHeight;
    const availableSpace = height - topPadding - bottomSection;
    const verticalOffset = Math.max(0, (availableSpace - totalContentHeight) / 2);

    // Surah name Arabic
    const surahY = topPadding + verticalOffset + 20;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(216, 179, 106, 0.6)";
    ctx.font = `32px "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif`;
    ctx.direction = "rtl";
    ctx.fillText(surahNameArabic, width / 2, surahY);

    // Arabic text — with proper gap from surah name
    ctx.fillStyle = "#f2eee6";
    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.font = `${arabicFontSize}px "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif`;

    const arabicStartY = surahY + surahToArabicGap;
    arabicLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, arabicStartY + i * arabicLineHeight);
    });

    // Translation text
    ctx.fillStyle = "rgba(168, 176, 186, 0.9)";
    ctx.font = `italic ${translationFontSize}px -apple-system, "Segoe UI", sans-serif`;
    ctx.direction = "ltr";
    ctx.textAlign = "center";

    const translationStartY = arabicStartY + arabicLines.length * arabicLineHeight + 25;
    translationLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, translationStartY + i * translationLineHeight);
    });

    // Reference — right below translation
    const refY = translationStartY + translationLines.length * translationLineHeight + 40;
    ctx.fillStyle = "rgba(111, 212, 177, 0.7)";
    ctx.font = `600 24px -apple-system, "Segoe UI", sans-serif`;
    ctx.direction = "ltr";
    ctx.textAlign = "center";
    ctx.fillText(reference, width / 2, refY);

    // Watermark — anchored to bottom
    ctx.fillStyle = "rgba(168, 176, 186, 0.35)";
    ctx.font = `16px -apple-system, "Segoe UI", sans-serif`;
    ctx.fillText("openfurqan.com", width / 2, height - 55);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create image"));
      },
      "image/png",
      1
    );
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export default function SharePanel({
  isOpen,
  onClose,
  ayah,
  surahNumber,
  surahName,
  surahNameArabic,
  selectedTranslation,
}: SharePanelProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  }, []);

  if (!isOpen || !ayah) return null;

  const arabic = normalizeQuranDisplayArabic(ayah.arabic || "");
  const translationText = ayah.translations?.[selectedTranslation]?.text || "";
  const reference = `${surahName} ${surahNumber}:${ayah.number}`;
  const shareText = `${arabic}\n\n"${translationText}"\n\n— ${reference}\n\nopenfurqan.com`;

  const ayahUrl = (() => {
    const base = typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? window.location.origin
      : "https://openfurqan.com";
    const slug = SURAH_BY_NUMBER.get(surahNumber)?.slug || String(surahNumber);
    return `${base}/surah/${slug}/${ayah.number}`;
  })();

  const handleCopyText = async () => {
    const text = `${arabic}\n\n"${translationText}"\n\n— ${reference}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
      setTimeout(onClose, 800);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("Copied to clipboard");
      setTimeout(onClose, 800);
    }
  };

  const handleSocialShare = (id: string) => {
    const social = SOCIAL_LINKS.find((s) => s.id === id);
    if (!social) return;
    const url = social.getUrl(shareText, ayahUrl);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      showToast("Share not supported on this device");
      return;
    }
    try {
      await navigator.share({ title: reference, text: shareText, url: ayahUrl });
    } catch {
      // User cancelled — do nothing
    }
  };

  const handleShareImage = async () => {
    setGeneratingImage(true);
    try {
      await document.fonts.ready;
      const blob = await generateAyahImage(arabic, translationText, reference, surahNameArabic);

      // Try native share with image first
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `${reference.replace(/\s+/g, "-")}.png`, { type: "image/png" });
        const shareData = { files: [file], title: reference };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setGeneratingImage(false);
          return;
        }
      }

      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reference.replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Image saved");
    } catch {
      showToast("Failed to generate image");
    }
    setGeneratingImage(false);
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="share-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Share ayah"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="share-handle" />

        {/* Ayah reference header */}
        <div className="share-header">
          <span className="share-reference">{reference}</span>
          <button className="share-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Social icons row */}
        <div className="share-socials">
          {SOCIAL_LINKS.map((social) => (
            <button
              key={social.id}
              className="share-social-btn"
              onClick={() => handleSocialShare(social.id)}
              aria-label={`Share on ${social.label}`}
              title={social.label}
            >
              <span className="share-social-icon" style={{ background: social.color }}>
                {social.icon}
              </span>
              <span className="share-social-label">{social.label}</span>
            </button>
          ))}
          <button
            className="share-social-btn"
            onClick={handleNativeShare}
            aria-label="More sharing options"
            title="More"
          >
            <span className="share-social-icon share-social-more">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </span>
            <span className="share-social-label">More</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="share-actions">
          <button className="share-action-btn" onClick={handleCopyText}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            <span>Copy Text</span>
          </button>
          <button
            className="share-action-btn share-action-image"
            onClick={handleShareImage}
            disabled={generatingImage}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span>{generatingImage ? "Generating..." : "Share as Image"}</span>
          </button>
        </div>

        {/* Toast */}
        {toast && <span className="share-toast">{toast}</span>}
      </div>
    </div>
  );
}
