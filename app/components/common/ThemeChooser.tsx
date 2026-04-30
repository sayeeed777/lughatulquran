"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useTheme } from "../../contexts";
import { PaletteIcon } from "./Icons";
import { THEMES } from "../../lib/themes";

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
                <div style={{ background: t.swatch[0], flex: 1 }} />
                <div style={{ background: t.swatch[1], flex: 1 }} />
                <div style={{ background: t.swatch[2], flex: 0.4 }} />
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
