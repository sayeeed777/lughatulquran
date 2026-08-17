"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import MemorizationSessionCard from "./MemorizationSessionCard";
import useMemorizationSrs, { DEFAULT_MEMORIZATION_SETTINGS } from "./useMemorizationSrs";
import { useLocalStorage } from "../../hooks";
import { SURAHS } from "../../data/surahs";
import { fetchJSON } from "../../lib/apiClient";
import { DEFAULT_RECITER, STORAGE_KEYS } from "../../lib/constants";
import {
  resolveBootstrappedReciterId,
  resolveReciterById
} from "../../lib/reciterPreferences";
import { getAudioUrl } from "../../lib/utils";
import type {
  MemorizationCard,
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
  cardMode: "word-by-word-meaning"
};

const CARD_MODES: Array<{ id: MemorizationCardMode; label: string; desc: string; icon: string }> = [
  {
    id: "word-by-word-meaning",
    label: "Word → Meaning",
    desc: "See an Arabic word, guess its meaning",
    icon: "Aa"
  },
  { id: "arabic-to-meaning", label: "Arabic → Meaning", desc: "See the Arabic ayah, guess its translation", icon: "عر" },
  { id: "meaning-to-arabic", label: "Meaning → Arabic", desc: "See the translation, recall the Arabic", icon: "En" },
  { id: "first-words", label: "First Words", desc: "See the opening words, complete the ayah", icon: "..." }
];

type MemorizationAppProps = {
  embedded?: boolean;
  reciterId?: string;
  onBack?: () => void;
};

const WORD_AUDIO_PREFIX = "https://audio.qurancdn.com/wbw/";

const shouldPreserveCardAudio = (card: MemorizationCard) =>
  card.cardMode === "word-by-word-meaning" && card.audioUrl.startsWith(WORD_AUDIO_PREFIX);

export function applyReciterToMemorizationDeck(
  deck: MemorizationDeckResponse | null,
  reciterBaseUrl: string
): MemorizationDeckResponse | null {
  if (!deck) return null;

  return {
    ...deck,
    cards: deck.cards.map((card) => {
      if (shouldPreserveCardAudio(card)) {
        return card;
      }

      const audioUrl = getAudioUrl(reciterBaseUrl, card.surahNumber, card.ayahNumber);
      return card.audioUrl === audioUrl ? card : { ...card, audioUrl };
    })
  };
}

export function MemorizationApp({ embedded = false, reciterId: activeReciterId, onBack }: MemorizationAppProps = {}) {
  const [prefs, setPrefs, prefsLoaded] = useLocalStorage<MemorizationDeckPrefs>(
    STORAGE_KEYS.memorizationDeckState,
    DEFAULT_PREFS
  );
  const [rawDeck, setRawDeck] = useState<MemorizationDeckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapReciterId, setBootstrapReciterId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || activeReciterId) return;
    setBootstrapReciterId(resolveBootstrappedReciterId(window.localStorage));
  }, [activeReciterId]);

  const resolvedReciter = useMemo(
    () => resolveReciterById(activeReciterId ?? bootstrapReciterId ?? DEFAULT_RECITER.id),
    [activeReciterId, bootstrapReciterId]
  );

  useEffect(() => {
    if (typeof window === "undefined" || activeReciterId) return;
    if (!bootstrapReciterId) return;
    if (window.localStorage.getItem(STORAGE_KEYS.reciter) !== null) return;
    window.localStorage.setItem(STORAGE_KEYS.reciter, JSON.stringify(resolvedReciter.id));
  }, [activeReciterId, bootstrapReciterId, resolvedReciter.id]);

  const scopeId = prefs.scopeMode === "surah"
    ? prefs.surahNumber
    : prefs.scopeMode === "juz"
      ? prefs.juzNumber
      : prefs.pageNumber;

  useEffect(() => {
    if (!prefsLoaded) return;

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
        setRawDeck(payload);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : String(err);
        if (/abort/i.test(msg)) return;
        setError(msg || "Unable to load memorization deck.");
        setRawDeck(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => controller.abort();
  }, [prefsLoaded, prefs.cardMode, prefs.scopeMode, scopeId]);

  const deck = useMemo(
    () => applyReciterToMemorizationDeck(rawDeck, resolvedReciter.baseUrl),
    [rawDeck, resolvedReciter.baseUrl]
  );

  const {
    counts,
    mastery,
    sessionHistory,
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
    undoLastReview,
    canUndo,
    settings,
    setSettings,
    suspendCurrentCard,
    resetDeckProgress
  } = useMemorizationSrs(deck);

  const [autoPlayAudio, setAutoPlayAudio] = useLocalStorage<boolean>(
    STORAGE_KEYS.memorizationAutoPlay,
    true
  );
  const [showSettings, setShowSettings] = useState(false);

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

  // Last 7 days for activity graph
  const last7Days = useMemo(() => {
    const days: Array<{ label: string; date: string; reviewed: number; completed: number }> = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = sessionHistory.find((e) => e.date === key);
      days.push({
        label: i === 0 ? "Today" : dayNames[d.getDay()],
        date: key,
        reviewed: entry?.reviewed || 0,
        completed: entry?.completed || 0
      });
    }
    return days;
  }, [sessionHistory]);

  const maxReviewed = Math.max(1, ...last7Days.map((d) => d.reviewed));
  const weekTotal = last7Days.reduce((sum, d) => sum + d.reviewed, 0);
  const masteryPct = mastery.total > 0
    ? Math.round(((mastery.reviewingCount + mastery.memorizedCount) / mastery.total) * 100)
    : 0;

  const hasActivity = last7Days.some((d) => d.reviewed > 0);

  // Calculate current streak (consecutive days with activity ending today or yesterday)
  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = sessionHistory.find((e) => e.date === key);
      if (entry && entry.reviewed > 0) {
        count++;
      } else if (i === 0) {
        // Today has no activity — still check yesterday
        continue;
      } else {
        break;
      }
    }
    return count;
  }, [sessionHistory]);

  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");

  const handleShareSession = useCallback(() => {
    const scopeLabel = prefs.scopeMode === "surah"
      ? SURAHS[prefs.surahNumber - 1]?.englishName || `Surah ${prefs.surahNumber}`
      : prefs.scopeMode === "juz"
        ? `Juz ${prefs.juzNumber}`
        : `Page ${prefs.pageNumber}`;
    const accuracy = sessionStats.reviewed > 0
      ? Math.round((sessionStats.completed / sessionStats.reviewed) * 100)
      : 0;
    const time = sessionStats.totalTimeMs >= 60000
      ? `${Math.round(sessionStats.totalTimeMs / 60000)}m`
      : `${Math.round(sessionStats.totalTimeMs / 1000)}s`;

    const lines = [
      `Quran Memorization - ${scopeLabel}`,
      `${sessionStats.reviewed} cards reviewed | ${accuracy}% accuracy | ${time}`,
    ];
    if (streak > 0) lines.push(`${streak} day streak`);
    lines.push("", "OpenFurqan.com");

    const text = lines.join("\n");

    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setShareStatus("copied");
        setTimeout(() => setShareStatus("idle"), 2000);
      }).catch(() => {});
    }
  }, [prefs, sessionStats, streak]);

  return (
    <main className={`mem-shell${embedded ? " mem-embedded" : ""}`}>
      {/* ── Header ── */}
      <header className="mem-header">
        <div className="mem-header-left">
          {onBack && !sessionActive && (
            <button type="button" className="mem-icon-btn" onClick={onBack} aria-label="Back to reader">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <h1 className="mem-title">Memorization</h1>
        </div>
        {!sessionActive && (
          <button type="button" className="mem-icon-btn" onClick={() => setShowSettings((s) => !s)} aria-label="Settings" title="Settings">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        )}
        {sessionActive && (
          <div className="mem-header-actions">
            <button
              type="button"
              className={`mem-icon-btn${autoPlayAudio ? "" : " mem-icon-btn--muted"}`}
              onClick={() => setAutoPlayAudio((v) => !v)}
              aria-label={autoPlayAudio ? "Mute auto-play" : "Unmute auto-play"}
              title={autoPlayAudio ? "Auto-play on" : "Auto-play off"}
            >
              {autoPlayAudio ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              )}
            </button>
            {canUndo && (
              <button type="button" className="mem-btn mem-btn--ghost mem-btn--sm" onClick={undoLastReview} aria-label="Undo last review" title="Undo (Ctrl+Z)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.69 3L3 13"/></svg>
                Undo
              </button>
            )}
            <button type="button" className="mem-btn mem-btn--ghost" onClick={stopSession}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              End
            </button>
          </div>
        )}
      </header>

      {/* ── Settings Panel ── */}
      {showSettings && !sessionActive && (
        <section className="mem-settings">
          <div className="mem-settings-header">
            <h3 className="mem-settings-title">Settings</h3>
            <button type="button" className="mem-icon-btn" onClick={() => setShowSettings(false)} aria-label="Close settings">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="mem-settings-grid">
            <label className="mem-settings-field">
              <span className="mem-settings-label">New cards per day</span>
              <input
                type="number"
                className="mem-settings-input"
                min={1}
                max={999}
                value={settings.newCardsPerDay}
                onChange={(e) => setSettings((s) => ({ ...s, newCardsPerDay: Math.max(1, Number(e.target.value) || 1) }))}
              />
            </label>
            <label className="mem-settings-field">
              <span className="mem-settings-label">Max reviews per day</span>
              <input
                type="number"
                className="mem-settings-input"
                min={1}
                max={9999}
                value={settings.maxReviewsPerDay}
                onChange={(e) => setSettings((s) => ({ ...s, maxReviewsPerDay: Math.max(1, Number(e.target.value) || 1) }))}
              />
            </label>
            <label className="mem-settings-field">
              <span className="mem-settings-label">Graduating interval (days)</span>
              <input
                type="number"
                className="mem-settings-input"
                min={1}
                max={365}
                value={settings.graduatingIntervalDays}
                onChange={(e) => setSettings((s) => ({ ...s, graduatingIntervalDays: Math.max(1, Number(e.target.value) || 1) }))}
              />
            </label>
            <label className="mem-settings-field">
              <span className="mem-settings-label">Easy interval (days)</span>
              <input
                type="number"
                className="mem-settings-input"
                min={1}
                max={365}
                value={settings.easyIntervalDays}
                onChange={(e) => setSettings((s) => ({ ...s, easyIntervalDays: Math.max(1, Number(e.target.value) || 1) }))}
              />
            </label>
            <label className="mem-settings-field">
              <span className="mem-settings-label">Max interval (days)</span>
              <input
                type="number"
                className="mem-settings-input"
                min={1}
                max={3650}
                value={settings.maxIntervalDays}
                onChange={(e) => setSettings((s) => ({ ...s, maxIntervalDays: Math.max(1, Number(e.target.value) || 1) }))}
              />
            </label>
            <label className="mem-settings-field">
              <span className="mem-settings-label">Leech threshold (lapses)</span>
              <input
                type="number"
                className="mem-settings-input"
                min={3}
                max={99}
                value={settings.leechThreshold}
                onChange={(e) => setSettings((s) => ({ ...s, leechThreshold: Math.max(3, Number(e.target.value) || 8) }))}
              />
            </label>
          </div>

          <label className="mem-settings-toggle">
            <input
              type="checkbox"
              checked={settings.autoSuspendLeeches}
              onChange={(e) => setSettings((s) => ({ ...s, autoSuspendLeeches: e.target.checked }))}
            />
            <span>Auto-suspend leech cards</span>
          </label>

          <button
            type="button"
            className="mem-btn mem-btn--ghost mem-btn--sm"
            onClick={() => setSettings(DEFAULT_MEMORIZATION_SETTINGS)}
          >
            Reset to defaults
          </button>
        </section>
      )}

      {/* ── Setup (single surface) ── */}
      {!sessionActive && (
        <section className="mem-setup">
          {/* Controls + Start button */}
          <div className="mem-controls">
            <div className="mem-scope-tabs" role="tablist">
              {(["surah", "juz"] as MemorizationScopeMode[]).map((mode) => (
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
              </button>
            ))}
          </div>

          {/* Mastery + Activity — flowing sections */}
          <div className="mem-insights">
            <div className="mem-mastery">
              <div className="mem-mastery-header">
                <h3 className="mem-mastery-title">Mastery</h3>
                <span className="mem-mastery-pct">{loading ? "–" : `${masteryPct}%`}</span>
              </div>

              <div className="mem-mastery-bar">
                {mastery.total > 0 && (
                  <>
                    {mastery.memorizedCount > 0 && (
                      <div className="mem-mastery-seg mem-mastery-seg--memorized" style={{ width: `${(mastery.memorizedCount / mastery.total) * 100}%` }} />
                    )}
                    {mastery.reviewingCount > 0 && (
                      <div className="mem-mastery-seg mem-mastery-seg--reviewing" style={{ width: `${(mastery.reviewingCount / mastery.total) * 100}%` }} />
                    )}
                    {mastery.learningCount > 0 && (
                      <div className="mem-mastery-seg mem-mastery-seg--learning" style={{ width: `${(mastery.learningCount / mastery.total) * 100}%` }} />
                    )}
                  </>
                )}
              </div>

              <div className="mem-mastery-legend">
                <span className="mem-legend-item"><span className="mem-legend-dot mem-legend-dot--memorized" />{mastery.memorizedCount} Strong</span>
                <span className="mem-legend-item"><span className="mem-legend-dot mem-legend-dot--reviewing" />{mastery.reviewingCount} Learned</span>
                <span className="mem-legend-item"><span className="mem-legend-dot mem-legend-dot--learning" />{mastery.learningCount} Learning</span>
                <span className="mem-legend-item"><span className="mem-legend-dot mem-legend-dot--new" />{mastery.newCount} New</span>
              </div>
            </div>

            <div className="mem-section-divider" />

            <div className="mem-activity">
              <div className="mem-activity-header">
                <h3 className="mem-activity-title">Activity</h3>
                {hasActivity && (
                  <div className="mem-activity-stats">
                    {streak > 0 && <span className="mem-streak">{streak} day streak</span>}
                    <span className="mem-week-total">{weekTotal} this week</span>
                  </div>
                )}
              </div>
              {hasActivity ? (
                <div className="mem-activity-graph">
                  {last7Days.map((day) => (
                    <div key={day.date} className="mem-activity-col">
                      <span className={`mem-activity-count${day.reviewed > 0 ? " mem-activity-count--active" : ""}`}>
                        {day.reviewed > 0 ? day.reviewed : ""}
                      </span>
                      <div className="mem-activity-bar-wrap">
                        <div
                          className={`mem-activity-bar${day.reviewed > 0 ? " mem-activity-bar--active" : ""}`}
                          style={{ height: `${day.reviewed > 0 ? Math.max(12, (day.reviewed / maxReviewed) * 100) : 4}%` }}
                        />
                      </div>
                      <span className="mem-activity-label">{day.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mem-activity-empty-text">No activity yet — complete a session to track your progress</p>
              )}
            </div>
          </div>

          {/* Start session */}
          <button
            type="button"
            className="mem-btn mem-btn--primary mem-btn--full mem-btn--start"
            onClick={startSession}
            disabled={!deck || loading}
          >
            {loading ? "Loading…" : `Start session · ${counts.dueNow} due`}
          </button>

          <div className="mem-deck-footer">
            <span className="mem-deck-meta">{totalCards} cards · {activeMode.label}</span>
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
              Reset progress
            </button>
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
              autoPlayAudio={autoPlayAudio}
              onReveal={revealAnswer}
              onRate={rateCurrentCard}
              onSuspend={suspendCurrentCard}
              onUndo={undoLastReview}
              canUndo={canUndo}
              leechThreshold={settings.leechThreshold}
              schedulerOpts={{ graduatingIntervalDays: settings.graduatingIntervalDays, easyIntervalDays: settings.easyIntervalDays, maxIntervalDays: settings.maxIntervalDays }}
            />
          ) : (
            <div className="mem-complete">
              <div className="mem-complete-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              </div>
              <h2 className="mem-complete-title">Session complete</h2>

              {/* Stats grid */}
              <div className="mem-complete-stats">
                <div className="mem-complete-stat">
                  <span className="mem-complete-stat-value">{sessionStats.reviewed}</span>
                  <span className="mem-complete-stat-label">Reviewed</span>
                </div>
                <div className="mem-complete-stat">
                  <span className="mem-complete-stat-value">
                    {sessionStats.reviewed > 0 ? Math.round((sessionStats.completed / sessionStats.reviewed) * 100) : 0}%
                  </span>
                  <span className="mem-complete-stat-label">Accuracy</span>
                </div>
                <div className="mem-complete-stat">
                  <span className="mem-complete-stat-value">
                    {sessionStats.totalTimeMs > 0
                      ? sessionStats.totalTimeMs >= 60000
                        ? `${Math.round(sessionStats.totalTimeMs / 60000)}m`
                        : `${Math.round(sessionStats.totalTimeMs / 1000)}s`
                      : "–"}
                  </span>
                  <span className="mem-complete-stat-label">Time</span>
                </div>
                <div className="mem-complete-stat">
                  <span className="mem-complete-stat-value">
                    {sessionStats.reviewed > 0
                      ? `${Math.round(sessionStats.totalTimeMs / sessionStats.reviewed / 1000)}s`
                      : "–"}
                  </span>
                  <span className="mem-complete-stat-label">Per card</span>
                </div>
              </div>

              {/* Rating breakdown bar */}
              {sessionStats.reviewed > 0 && (
                <div className="mem-complete-breakdown">
                  <div className="mem-complete-breakdown-bar">
                    {sessionStats.againCount > 0 && (
                      <div className="mem-breakdown-seg mem-breakdown-seg--again" style={{ width: `${(sessionStats.againCount / sessionStats.reviewed) * 100}%` }} />
                    )}
                    {sessionStats.hardCount > 0 && (
                      <div className="mem-breakdown-seg mem-breakdown-seg--hard" style={{ width: `${(sessionStats.hardCount / sessionStats.reviewed) * 100}%` }} />
                    )}
                    {sessionStats.goodCount > 0 && (
                      <div className="mem-breakdown-seg mem-breakdown-seg--good" style={{ width: `${(sessionStats.goodCount / sessionStats.reviewed) * 100}%` }} />
                    )}
                    {sessionStats.easyCount > 0 && (
                      <div className="mem-breakdown-seg mem-breakdown-seg--easy" style={{ width: `${(sessionStats.easyCount / sessionStats.reviewed) * 100}%` }} />
                    )}
                  </div>
                  <div className="mem-complete-breakdown-legend">
                    {sessionStats.againCount > 0 && <span className="mem-breakdown-item mem-breakdown-item--again">{sessionStats.againCount} Again</span>}
                    {sessionStats.hardCount > 0 && <span className="mem-breakdown-item mem-breakdown-item--hard">{sessionStats.hardCount} Hard</span>}
                    {sessionStats.goodCount > 0 && <span className="mem-breakdown-item mem-breakdown-item--good">{sessionStats.goodCount} Good</span>}
                    {sessionStats.easyCount > 0 && <span className="mem-breakdown-item mem-breakdown-item--easy">{sessionStats.easyCount} Easy</span>}
                  </div>
                </div>
              )}

              <div className="mem-complete-actions">
                <button type="button" className="mem-btn mem-btn--primary" onClick={startSession}>New session</button>
                <button type="button" className="mem-btn mem-btn--ghost" onClick={stopSession}>Back to deck</button>
              </div>
              <button type="button" className="mem-share-btn" onClick={handleShareSession}>
                {shareStatus === "copied" ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    Share results
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default MemorizationApp;
