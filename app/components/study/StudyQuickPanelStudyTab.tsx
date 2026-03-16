"use client";

import { useMemo, useState } from "react";
import { SURAH_AYAH_COUNTS } from "../../lib/constants";
import type { DailyReading } from "../../lib/types";
import type { PlanSummary } from "./StudyQuickPanelTypes";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TOTAL_QURAN_AYAHS = 6236;

type StudyQuickPanelStudyTabProps = {
  readingTime: number;
  progress: number;
  goalTarget: number;
  goalProgress: number;
  setGoalPerDay: (value: number) => void;
  planSummary: PlanSummary;
  surahByNumber: Map<number, { englishName: string }>;
  onJumpToAyah: (surah: number, ayah: number) => void;
  onClosePanel: () => void;
  formatTime: (seconds: number) => string;
  todayVersesRead: number;
  weekTotal: number;
  currentStreak: number;
  weeklyData: DailyReading[];
  surahProgress: Record<number, number[]>;
  hifzMarks: Record<string, true>;
  selectedSurahNumber: number;
  selectedSurahName: string;
  totalAyahs: number;
  markHifzRange: (surahNumber: number, startAyah: number, endAyah: number) => void;
  clearHifzSurah: (surahNumber: number, totalAyahs: number) => void;
};

function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function WeeklyChart({ data }: { data: DailyReading[] }) {
  const maxVerses = Math.max(...data.map((d) => d.versesRead), 1);
  const today = getLocalDateString();

  return (
    <div className="qp-weekly-chart">
      <div className="qp-weekly-bars">
        {data.map((day) => {
          const height = day.versesRead > 0 ? Math.max((day.versesRead / maxVerses) * 100, 6) : 0;
          const dayOfWeek = new Date(day.date + "T12:00:00").getDay();
          const isToday = day.date === today;
          return (
            <div key={day.date} className={`qp-bar-col${isToday ? " today" : ""}`}>
              <span className="qp-bar-value">{day.versesRead || ""}</span>
              <div className="qp-bar-track">
                <div className="qp-bar-fill" style={{ height: `${height}%` }} />
              </div>
              <span className="qp-bar-label">{DAY_LABELS[dayOfWeek]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniRing({ progress, size = 34 }: { progress: number; size?: number }) {
  const sw = 3.5;
  const r = (size - sw) / 2;
  const c = r * 2 * Math.PI;
  const offset = c - (Math.min(progress, 100) / 100) * c;
  const center = size / 2;
  return (
    <svg width={size} height={size} className="qp-mini-ring">
      <circle className="qp-ring-bg" strokeWidth={sw} fill="transparent" r={r} cx={center} cy={center} />
      <circle
        className="qp-ring-fill"
        strokeWidth={sw}
        strokeLinecap="round"
        fill="transparent"
        r={r}
        cx={center}
        cy={center}
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </svg>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="qp-stepper">
      <button
        className="qp-stepper-btn"
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span className="qp-stepper-value">{value}</span>
      <button
        className="qp-stepper-btn"
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

export default function StudyQuickPanelStudyTab({
  readingTime,
  progress,
  goalTarget,
  goalProgress,
  setGoalPerDay,
  planSummary,
  surahByNumber,
  onJumpToAyah,
  onClosePanel,
  formatTime,
  todayVersesRead,
  weekTotal,
  currentStreak,
  weeklyData,
  surahProgress,
  hifzMarks,
  selectedSurahNumber,
  selectedSurahName,
  totalAyahs,
  markHifzRange,
  clearHifzSurah
}: StudyQuickPanelStudyTabProps) {
  const [showAllSurahs, setShowAllSurahs] = useState(false);
  const overallProgress = Math.max(0, Math.min(100, Math.round(progress)));

  const surahEntries = useMemo(() => {
    const items: {
      number: number;
      name: string;
      total: number;
      read: number;
      pct: number;
      memorized: number;
      memPct: number;
    }[] = [];

    const surahNumbers = new Set<number>();
    for (const numStr of Object.keys(surahProgress)) surahNumbers.add(Number(numStr));
    for (const key of Object.keys(hifzMarks || {})) {
      const sNum = Number(key.split(":")[0]);
      if (sNum) surahNumbers.add(sNum);
    }

    for (const num of surahNumbers) {
      const surah = surahByNumber.get(num);
      if (!surah) continue;
      const total = SURAH_AYAH_COUNTS[num - 1] || 0;
      if (!total) continue;
      const ayahs = surahProgress[num];
      const read = ayahs ? new Set(ayahs).size : 0;
      let memorized = 0;
      for (let i = 1; i <= total; i += 1) {
        if (hifzMarks[`${num}:${i}`]) memorized += 1;
      }
      if (read === 0 && memorized === 0) continue;
      items.push({
        number: num,
        name: surah.englishName,
        total,
        read,
        pct: Math.round((read / total) * 100),
        memorized,
        memPct: Math.round((memorized / total) * 100)
      });
    }

    return items.sort((a, b) => b.pct - a.pct);
  }, [surahProgress, surahByNumber, hifzMarks]);

  const almostDone = useMemo(
    () => surahEntries.filter((entry) => entry.pct >= 70 && entry.pct < 100),
    [surahEntries]
  );

  const displayedSurahs = showAllSurahs ? surahEntries : surahEntries.slice(0, 4);
  const streakClass = currentStreak >= 7 ? "qp-streak-fire" : currentStreak >= 3 ? "qp-streak-warm" : "";
  const goalPct = goalTarget > 0 ? Math.min(100, Math.round((goalProgress / goalTarget) * 100)) : 0;
  const totalHifzCount = Object.keys(hifzMarks || {}).length;
  const hifzPct = Math.round((totalHifzCount / TOTAL_QURAN_AYAHS) * 100);

  const currentSurahHifzCount = useMemo(() => {
    if (!selectedSurahNumber) return 0;
    let count = 0;
    for (let i = 1; i <= totalAyahs; i += 1) {
      if (hifzMarks[`${selectedSurahNumber}:${i}`]) count += 1;
    }
    return count;
  }, [selectedSurahNumber, totalAyahs, hifzMarks]);

  const currentSurahHifzPct = totalAyahs > 0 ? Math.round((currentSurahHifzCount / totalAyahs) * 100) : 0;

  return (
    <div className="quick-panel-section qp-apple" data-overall-progress={overallProgress}>
      <div className="qp-a-stats">
        <div className="qp-a-stat">
          <span className="qp-a-num qp-a-today">{todayVersesRead}</span>
          <span className="qp-a-label">Verses today</span>
        </div>
        <div className="qp-a-stat">
          <span className="qp-a-num qp-a-week">{weekTotal}</span>
          <span className="qp-a-label">This week</span>
        </div>
        <div className={`qp-a-stat ${streakClass}`}>
          <span className="qp-a-num qp-a-streak">{String(currentStreak).padStart(2, "0")}</span>
          <span className="qp-a-label">Day streak</span>
        </div>
        <div className="qp-a-stat">
          <span className="qp-a-num qp-a-session">{formatTime(readingTime)}</span>
          <span className="qp-a-label">Session</span>
        </div>
      </div>

      <div className="qp-group">
        <div className="qp-group-header">
          <h4>Weekly Activity</h4>
        </div>
        <WeeklyChart data={weeklyData} />
      </div>

      <div className="qp-group">
        <div className="qp-group-header">
          <h4>Daily Goal</h4>
        </div>
        <div className="qp-goal-row">
          <div className="qp-goal-info">
            <span className="qp-goal-fraction">
              {goalProgress}
              <span className="qp-goal-of">/{goalTarget}</span>
            </span>
            <span className="qp-goal-sublabel">ayahs read</span>
          </div>
          <Stepper value={goalTarget} min={1} max={200} onChange={setGoalPerDay} />
        </div>
        <div className="qp-goal-bar">
          <div className="qp-goal-bar-fill" style={{ width: `${goalPct}%` }} />
        </div>
      </div>

      {surahEntries.length > 0 && (
        <div className="qp-group">
          <div className="qp-group-header">
            <h4>Surah Progress</h4>
            {surahEntries.length > 4 && (
              <button className="qp-see-all" onClick={() => setShowAllSurahs(!showAllSurahs)} type="button">
                {showAllSurahs ? "Less" : "See All"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={showAllSurahs ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
                </svg>
              </button>
            )}
          </div>

          {almostDone.length > 0 && (
            <div className="qp-almost-banner">
              <svg className="qp-almost-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span className="qp-almost-text">
                {almostDone.slice(0, 2).map((surah) => surah.name).join(" & ")}
                {almostDone.length > 2 ? ` +${almostDone.length - 2}` : ""}
                {" — almost complete"}
              </span>
            </div>
          )}

          <div className="qp-surah-list">
            {displayedSurahs.map((entry) => (
              <div key={entry.number} className="qp-surah-row">
                <MiniRing progress={entry.pct} />
                <div className="qp-surah-info">
                  <span className="qp-surah-name">{entry.number}. {entry.name}</span>
                  <span className="qp-surah-detail">
                    {entry.read}/{entry.total} read
                    {entry.memorized > 0 && (
                      <span className="qp-surah-hifz-detail"> · {entry.memorized} memorized</span>
                    )}
                  </span>
                </div>
                <div className="qp-surah-badges">
                  {entry.memorized > 0 && (
                    <span className={`qp-surah-mem-pct${entry.memPct === 100 ? " done" : ""}`}>
                      {entry.memPct === 100 ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 12l2 2 4-4" />
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      ) : `${entry.memPct}%`}
                    </span>
                  )}
                  <span className={`qp-surah-pct${entry.pct === 100 ? " done" : ""}`}>
                    {entry.pct === 100 ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : `${entry.pct}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="qp-group hifz-group">
        <div className="qp-group-header">
          <h4>Memorization</h4>
          <span className="hifz-total-badge">{totalHifzCount} / {TOTAL_QURAN_AYAHS}</span>
        </div>

        <div className="hifz-stats-row">
          <div className="hifz-stat">
            <MiniRing progress={hifzPct} />
            <div className="hifz-stat-text">
              <span className="hifz-stat-value">{hifzPct >= 1 ? `${hifzPct}%` : `${totalHifzCount} ayahs`}</span>
              <span className="hifz-stat-label">Overall</span>
            </div>
          </div>
          <div className="hifz-stat">
            <MiniRing progress={currentSurahHifzPct} />
            <div className="hifz-stat-text">
              <span className="hifz-stat-value">{currentSurahHifzCount}/{totalAyahs}</span>
              <span className="hifz-stat-label">{selectedSurahName || "Current"}</span>
            </div>
          </div>
        </div>

        {totalAyahs > 0 && (
          <div className="hifz-actions">
            {currentSurahHifzCount < totalAyahs ? (
              <button
                className="hifz-action-btn"
                type="button"
                onClick={() => markHifzRange(selectedSurahNumber, 1, totalAyahs)}
              >
                Mark all {totalAyahs} ayahs as memorized
              </button>
            ) : (
              <button
                className="hifz-clear-link"
                type="button"
                onClick={() => clearHifzSurah(selectedSurahNumber, totalAyahs)}
              >
                Clear memorization
              </button>
            )}
          </div>
        )}
      </div>

      {planSummary && !("completed" in planSummary) && !("error" in planSummary) && (
        <div className="qp-group">
          <div className="qp-group-header">
            <h4>Today&apos;s Plan</h4>
          </div>
          <p className="plan-range-text">
            {planSummary.startVerse && planSummary.endVerse
              ? `${surahByNumber?.get(planSummary.startVerse.surah)?.englishName || "Surah"} ${planSummary.startVerse.ayah} — ${surahByNumber?.get(planSummary.endVerse.surah)?.englishName || "Surah"} ${planSummary.endVerse.ayah}`
              : "Set up your reading plan"}
          </p>
          {planSummary.startVerse && (
            <button
              className="plan-jump-btn"
              onClick={() => {
                const startVerse = planSummary.startVerse;
                if (!startVerse) return;
                onJumpToAyah(startVerse.surah, startVerse.ayah);
                onClosePanel();
              }}
              type="button"
            >
              Start Reading
            </button>
          )}
        </div>
      )}
    </div>
  );
}
