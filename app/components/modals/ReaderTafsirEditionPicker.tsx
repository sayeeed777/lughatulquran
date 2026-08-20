"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TafsirEdition } from "../../lib/tafsirEditions";
import { CheckIcon, CloseIcon, SearchIcon } from "../common/Icons";

type ReaderTafsirEditionPickerProps = {
  editions: readonly TafsirEdition[];
  value: string;
  onChange: (editionId: string) => void;
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  bn: "Bangla",
  hi: "Hindi",
  ur: "Urdu"
};

const getLanguageLabel = (language: string) =>
  LANGUAGE_LABELS[language] || language.toUpperCase();

export default function ReaderTafsirEditionPicker({
  editions,
  value,
  onChange
}: ReaderTafsirEditionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedOptionRef = useRef<HTMLButtonElement>(null);
  const selectedEdition = editions.find((edition) => edition.id === value) ?? editions[0];

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const groups = new Map<string, TafsirEdition[]>();

    editions.forEach((edition) => {
      const languageLabel = getLanguageLabel(edition.language);
      const matches =
        !normalizedQuery ||
        edition.label.toLocaleLowerCase().includes(normalizedQuery) ||
        languageLabel.toLocaleLowerCase().includes(normalizedQuery);

      if (!matches) return;
      const group = groups.get(edition.language) ?? [];
      group.push(edition);
      groups.set(edition.language, group);
    });

    return Array.from(groups.entries());
  }, [editions, query]);

  const closePicker = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const openPicker = () => {
    setQuery("");
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
      selectedOptionRef.current?.scrollIntoView({ block: "nearest" });
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const chooseEdition = (editionId: string) => {
    onChange(editionId);
    closePicker();
  };

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closePicker();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.stopPropagation();
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="compare-tafsir-select reader-tafsir-picker-trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={openPicker}
      >
        <span className="reader-tafsir-picker-trigger-copy">
          <span className="reader-tafsir-picker-trigger-label">
            {selectedEdition?.label || "Choose Tafsir edition"}
          </span>
          {selectedEdition && (
            <span className="reader-tafsir-picker-trigger-language">
              {getLanguageLabel(selectedEdition.language)}
            </span>
          )}
        </span>
        <span className="reader-tafsir-picker-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && typeof document !== "undefined" &&
        createPortal(
          <div className="reader-tafsir-picker-overlay" onClick={closePicker}>
            <div
              className="reader-tafsir-picker-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={trapFocus}
            >
              <div className="reader-tafsir-picker-handle" aria-hidden="true" />
              <div className="reader-tafsir-picker-header">
                <div>
                  <p className="reader-tafsir-picker-eyebrow">Reader Tafsir</p>
                  <h3 id={titleId}>Choose an edition</h3>
                </div>
                <button
                  type="button"
                  className="reader-tafsir-picker-close"
                  aria-label="Close Tafsir edition picker"
                  onClick={closePicker}
                >
                  <CloseIcon size={19} />
                </button>
              </div>

              <label className="reader-tafsir-picker-search">
                <SearchIcon size={18} aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search editions or languages"
                  aria-label="Search Tafsir editions"
                />
              </label>

              <div className="reader-tafsir-picker-options" aria-live="polite">
                {filteredGroups.length > 0 ? (
                  filteredGroups.map(([language, languageEditions]) => (
                    <section className="reader-tafsir-picker-group" key={language}>
                      <h4>{getLanguageLabel(language)}</h4>
                      <div role="radiogroup" aria-label={`${getLanguageLabel(language)} Tafsir editions`}>
                        {languageEditions.map((edition) => {
                          const isSelected = edition.id === value;
                          return (
                            <button
                              key={edition.id}
                              ref={isSelected ? selectedOptionRef : undefined}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              className={`reader-tafsir-picker-option${isSelected ? " selected" : ""}`}
                              onClick={() => chooseEdition(edition.id)}
                            >
                              <span>{edition.label}</span>
                              <span className="reader-tafsir-picker-check" aria-hidden="true">
                                {isSelected && <CheckIcon size={16} />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="reader-tafsir-picker-empty">
                    No Tafsir editions match “{query.trim()}”.
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
