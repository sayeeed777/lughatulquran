"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useTheme } from "../../contexts";
import { PaletteIcon } from "./Icons";
import type { ThemeName } from "../../contexts/ThemeContext";

const THEMES: { id: ThemeName; label: string; colors: [string, string, string] }[] = [
  { id: "dark", label: "Dark", colors: ["#0e1418", "#1b242c", "#6fd4b1"] },
  { id: "light", label: "Parchment", colors: ["#e8ded1", "#f0e7db", "#425236"] },
  { id: "bw", label: "Black & White", colors: ["#ffffff", "#f5f5f5", "#111111"] },
  { id: "bw-dark", label: "Dark B&W", colors: ["#000000", "#111111", "#ffffff"] },
  { id: "mist", label: "Mist", colors: ["#263d42", "#2a4247", "#8fb299"] },
  { id: "sky", label: "Sky", colors: ["#b8d4e4", "#dbeaf2", "#1b6b80"] }
];

function ThemeChooser() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="theme-chooser" ref={ref}>
      <button
        className="header-icon-btn"
        onClick={() => setOpen((p) => !p)}
        aria-label="Choose theme"
        aria-expanded={open}
      >
        <PaletteIcon />
      </button>
      {open && (
        <div className="theme-chooser-popup" role="listbox" aria-label="Theme options">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-option${theme === t.id ? " active" : ""}`}
              role="option"
              aria-selected={theme === t.id}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
            >
              <div className="theme-swatch" aria-hidden="true">
                <div style={{ background: t.colors[0], flex: 1 }} />
                <div style={{ background: t.colors[1], flex: 1 }} />
                <div style={{ background: t.colors[2], flex: 0.4 }} />
              </div>
              <span className="theme-label">{t.label}</span>
              {theme === t.id && (
                <svg className="theme-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(ThemeChooser);
