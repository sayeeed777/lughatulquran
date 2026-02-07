"use client";

type Surah = {
  number: number;
  englishName: string;
  numberOfAyahs: number;
};

type ReadingPlanState = {
  startDate: string;
  perDay: number;
  startSurah: number;
  startAyah: number;
};

type PlanSummaryRange = {
  dayIndex: number;
  startVerse: { surah: number; ayah: number } | null;
  endVerse: { surah: number; ayah: number } | null;
  todayStartIndex: number;
  todayEndIndex: number;
};

type PlanSummary =
  | null
  | { error: string }
  | { completed: true; dayIndex: number }
  | PlanSummaryRange;

const isRangeSummary = (summary: PlanSummary): summary is PlanSummaryRange => {
  return !!summary && !("error" in summary) && !("completed" in summary);
};

type ReadingPlanProps = {
  surahs: Surah[];
  surahByNumber: Map<number, Surah>;
  readingPlan: ReadingPlanState;
  setReadingPlan: (value: ReadingPlanState | ((prev: ReadingPlanState) => ReadingPlanState)) => void;
  planSummary: PlanSummary;
  onJumpToAyah: (surah: number, ayah: number) => void;
  formatRangeLabel: (start: { surah: number; ayah: number } | null, end: { surah: number; ayah: number } | null) => string;
  getLocalDateString: () => string;
};

export default function ReadingPlan({
  surahs,
  surahByNumber,
  readingPlan,
  setReadingPlan,
  planSummary,
  onJumpToAyah,
  formatRangeLabel,
  getLocalDateString
}: ReadingPlanProps) {
  const plan = readingPlan || {} as ReadingPlanState;

  return (
    <div className="study-section">
      <h3>Daily plan</h3>
      <div className="plan-grid">
        <label className="field">
          <span>Start date</span>
          <input
            type="date"
            value={plan.startDate || getLocalDateString()}
            onChange={(event) =>
              setReadingPlan((prev) => ({
                ...prev,
                startDate: event.target.value
              }))
            }
          />
        </label>
        <label className="field">
          <span>Ayahs per day</span>
          <input
            type="number"
            min={1}
            max={200}
            value={plan.perDay ?? 10}
            onChange={(event) =>
              setReadingPlan((prev) => ({
                ...prev,
                perDay: Number(event.target.value)
              }))
            }
          />
        </label>
        <label className="field">
          <span>Start surah</span>
          <select
            value={plan.startSurah ?? 1}
            onChange={(event) =>
              setReadingPlan((prev) => ({
                ...prev,
                startSurah: Number(event.target.value)
              }))
            }
          >
            {surahs.map((surah) => (
              <option key={surah.number} value={surah.number}>
                {surah.number}. {surah.englishName}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Start ayah</span>
          <input
            type="number"
            min={1}
            max={surahByNumber.get(plan.startSurah)?.numberOfAyahs || 1}
            value={plan.startAyah ?? 1}
            onChange={(event) =>
              setReadingPlan((prev) => ({
                ...prev,
                startAyah: Number(event.target.value)
              }))
            }
          />
        </label>
      </div>
      <div className="plan-summary">
        <p className="label">Today</p>
        {!planSummary ? (
          <p className="plan-range">Loading plan...</p>
        ) : "completed" in planSummary && planSummary.completed ? (
          <p className="plan-range">Plan complete. Adjust the start date to begin again.</p>
        ) : "error" in planSummary && planSummary.error ? (
          <p className="plan-range">{planSummary.error}</p>
        ) : isRangeSummary(planSummary) ? (
          <>
            <p className="plan-range">
              {formatRangeLabel(planSummary.startVerse, planSummary.endVerse)}
            </p>
            {planSummary.startVerse && (
              <button
                className="action-btn"
                onClick={() =>
                  onJumpToAyah(planSummary.startVerse.surah, planSummary.startVerse.ayah)
                }
              >
                Jump to today
              </button>
            )}
          </>
        ) : (
          <p className="plan-range">Loading plan...</p>
        )}
      </div>
    </div>
  );
}
