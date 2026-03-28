"use client";

import { useEffect, useMemo, useState } from "react";
import MemorizationSessionCard from "./MemorizationSessionCard";
import useMemorizationSrs from "./useMemorizationSrs";
import { useLocalStorage } from "../../hooks";
import { SURAHS } from "../../data/surahs";
import { fetchJSON } from "../../lib/apiClient";
import { STORAGE_KEYS } from "../../lib/constants";
import type {
  MemorizationCardMode,
  MemorizationDeckResponse,
  MemorizationScopeMode
} from "../../lib/types";

type MemorizationDeckPrefs = {
  scopeMode: MemorizationScopeMode;
  surahNumber: number;
  juzNumber: number;
  pageNumber: number;
  cardMode: MemorizationCardMode;
};

const DEFAULT_PREFS: MemorizationDeckPrefs = {
  scopeMode: "surah",
  surahNumber: 1,
  juzNumber: 1,
  pageNumber: 1,
  cardMode: "arabic-to-meaning"
};

const CARD_MODES: Array<{ id: MemorizationCardMode; label: string; desc: string }> = [
  { id: "arabic-to-meaning", label: "Arabic → Meaning", desc: "Read Arabic, recall the meaning" },
  { id: "meaning-to-arabic", label: "Meaning → Arabic", desc: "See meaning, recall the Arabic" },
  { id: "first-words", label: "First Words", desc: "Continue the ayah from its opening" },
  {
    id: "word-by-word-meaning",
    label: "Word → Meaning",
    desc: "Memorize each Arabic word with its English meaning"
  }
];

export default function MemorizationApp() {
  return <MemorizationAppInner />;
}

type MemorizationAppProps = {
  embedded?: boolean;
};

function MemorizationAppInner({ embedded = false }: MemorizationAppProps = {}) {
  const [prefs, setPrefs] = useLocalStorage<MemorizationDeckPrefs>(
    STORAGE_KEYS.memorizationDeckState,
    DEFAULT_PREFS
  );
  const [deck, setDeck] = useState<MemorizationDeckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scopeId = prefs.scopeMode === "surah"
    ? prefs.surahNumber
    : prefs.scopeMode === "juz"
      ? prefs.juzNumber
      : prefs.pageNumber;

  useEffect(() => {
    const controller = new AbortController();
    const cacheKey = `memorization:${prefs.scopeMode}:${scopeId}:${prefs.cardMode}`;
    setLoading(true);
    setError(null);

    fetchJSON<MemorizationDeckResponse>(
      `/api/memorization/deck?scope=${prefs.scopeMode}&id=${scopeId}&mode=${prefs.cardMode}`,
      {
        ttl: 30 * 60 * 1000,
        persist: true,
        staleWhileRevalidate: true,
        cacheKey,
        signal: controller.signal
      }
    )
      .then((payload) => {
        if (controller.signal.aborted) return;
        setDeck(payload);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : String(err);
        if (/abort/i.test(msg)) return;
        setError(msg || "Unable to load memorization deck.");
        setDeck(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => controller.abort();
  }, [prefs.cardMode, prefs.scopeMode, scopeId]);

  const {
    counts,
    sessionActive,
    sessionQueue,
    currentCard,
    currentCardState,
    showAnswer,
    sessionStats,
    startSession,
    stopSession,
    revealAnswer,
    rateCurrentCard,
    suspendCurrentCard,
    resetDeckProgress
  } = useMemorizationSrs(deck);

  const scopeOptions = useMemo(() => {
    if (prefs.scopeMode === "surah") {
      return SURAHS.map((s) => ({ value: s.number, label: `${s.number}. ${s.englishName}` }));
    }
    const max = prefs.scopeMode === "juz" ? 30 : 604;
    return Array.from({ length: max }, (_, i) => ({
      value: i + 1,
      label: `${prefs.scopeMode === "juz" ? "Juz" : "Page"} ${i + 1}`
    }));
  }, [prefs.scopeMode]);

  const setScopeMode = (scopeMode: MemorizationScopeMode) =>
    setPrefs((p) => ({ ...p, scopeMode }));

  const setScopeValue = (value: number) =>
    setPrefs((p) => {
      if (p.scopeMode === "surah") return { ...p, surahNumber: value };
      if (p.scopeMode === "juz") return { ...p, juzNumber: value };
      return { ...p, pageNumber: value };
    });

  const setCardMode = (cardMode: MemorizationCardMode) =>
    setPrefs((p) => ({ ...p, cardMode }));

  const activeMode = CARD_MODES.find((m) => m.id === prefs.cardMode)!;
  const totalCards = deck?.deck.totalCards || 0;
  const progressPct = totalCards
    ? Math.round((sessionStats.reviewed / totalCards) * 100)
    : 0;
  const meaningSourceLabel = prefs.cardMode === "word-by-word-meaning"
    ? "Word meanings"
    : "Abdel Haleem";

  return (
    <main className={`mem-shell${embedded ? " mem-embedded" : ""}`}>
      {/* ── Header ── */}
      <header className="mem-header">
        <div className="mem-header-left">
          <h1 className="mem-title">Memorization</h1>
        </div>
        {sessionActive && (
          <button type="button" className="mem-btn mem-btn--ghost" onClick={stopSession}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            End
          </button>
        )}
      </header>

      {/* ── Setup (single surface) ── */}
      {!sessionActive && (
        <section className="mem-setup">
          {/* Controls row */}
          <div className="mem-controls">
            <div className="mem-scope-tabs" role="tablist">
              {(["surah", "juz", "page"] as MemorizationScopeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={prefs.scopeMode === mode}
                  className={`mem-scope-tab${prefs.scopeMode === mode ? " active" : ""}`}
                  onClick={() => setScopeMode(mode)}
                >
                  {mode === "surah" ? "Surah" : mode === "juz" ? "Juz" : "Page"}
                </button>
              ))}
            </div>

            <div className="mem-deck-picker">
              <select
                className="mem-select"
                value={scopeId}
                onChange={(e) => setScopeValue(Number(e.target.value))}
              >
                {scopeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg className="mem-select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          {/* Mode cards */}
          <div className="mem-mode-grid">
            {CARD_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`mem-mode-card${prefs.cardMode === m.id ? " active" : ""}`}
                onClick={() => setCardMode(m.id)}
              >
                <span className="mem-mode-card-title">{m.label}</span>
                <span className="mem-mode-card-desc">{m.desc}</span>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className={`mem-stats-row${loading ? " mem-stats-loading" : ""}`}>
            <div className="mem-stat mem-stat--due">
              <span className="mem-stat-value">{loading ? "–" : counts.dueNow}</span>
              <span className="mem-stat-label">Due</span>
            </div>
            <div className="mem-stat-divider" />
            <div className="mem-stat mem-stat--new">
              <span className="mem-stat-value">{loading ? "–" : counts.newCount}</span>
              <span className="mem-stat-label">New</span>
            </div>
            <div className="mem-stat-divider" />
            <div className="mem-stat mem-stat--learning">
              <span className="mem-stat-value">{loading ? "–" : counts.learningCount}</span>
              <span className="mem-stat-label">Learning</span>
            </div>
            <div className="mem-stat-divider" />
            <div className="mem-stat mem-stat--review">
              <span className="mem-stat-value">{loading ? "–" : counts.reviewDueCount}</span>
              <span className="mem-stat-label">Review</span>
            </div>
          </div>

          {/* Deck info + actions */}
          <div className="mem-deck-info">
            <div className="mem-deck-info-text">
              <h2 className="mem-deck-label">{deck?.deck.scopeLabel || "Select a deck"}</h2>
              <p className="mem-deck-meta">{totalCards} cards · {activeMode.label}</p>
            </div>
            <div className="mem-deck-actions">
              <button
                type="button"
                className="mem-btn mem-btn--primary"
                onClick={startSession}
                disabled={!deck || loading}
              >
                {loading ? "Loading…" : "Start session"}
              </button>
              <button
                type="button"
                className="mem-btn mem-btn--ghost mem-btn--sm"
                onClick={() => {
                  if (window.confirm(`Reset all progress for ${totalCards} cards? This cannot be undone.`)) {
                    resetDeckProgress();
                  }
                }}
                disabled={!deck}
              >
                Reset
              </button>
            </div>
          </div>

          {error && (
            <div className="mem-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
              {error}
            </div>
          )}
        </section>
      )}

      {/* ── Session ── */}
      {sessionActive && (
        <section className="mem-session">
          <div className="mem-progress-bar">
            <div className="mem-progress-stats">
              <span className="mem-progress-pill">
                <strong>{sessionQueue.length}</strong>&nbsp;remaining
              </span>
              <span className="mem-progress-pill">
                <strong>{sessionStats.reviewed}</strong>&nbsp;reviewed
              </span>
              <span className="mem-progress-pill mem-progress-pill--good">
                <strong>{sessionStats.completed}</strong>&nbsp;passed
              </span>
              {sessionStats.againCount > 0 && (
                <span className="mem-progress-pill mem-progress-pill--again">
                  <strong>{sessionStats.againCount}</strong>&nbsp;again
                </span>
              )}
            </div>
            <div className="mem-progress-track">
              <div className="mem-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {currentCard ? (
            <MemorizationSessionCard
              card={currentCard}
              state={currentCardState}
              showAnswer={showAnswer}
              onReveal={revealAnswer}
              onRate={rateCurrentCard}
              onSuspend={suspendCurrentCard}
            />
          ) : (
            <div className="mem-complete">
              <div className="mem-complete-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              </div>
              <h2 className="mem-complete-title">Session complete</h2>
              <p className="mem-complete-meta">
                {sessionStats.reviewed} reviewed · {sessionStats.completed} passed{sessionStats.againCount > 0 ? ` · ${sessionStats.againCount} repeated` : ""}
              </p>
              <div className="mem-complete-actions">
                <button type="button" className="mem-btn mem-btn--primary" onClick={startSession}>New session</button>
                <button type="button" className="mem-btn mem-btn--ghost" onClick={stopSession}>Back to deck</button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export { MemorizationAppInner as MemorizationApp };
