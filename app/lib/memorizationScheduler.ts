import type {
  MemorizationCardState,
  MemorizationRating,
  MemorizationSettings
} from "./types";

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const DEFAULT_EASE = 2.5;
const LEARNING_DELAY_MS = 10 * 60 * 1000;
const HARD_DELAY_MS = 20 * 60 * 1000;
const DAY_MS = 86400000;

const DEFAULT_GRADUATING_DAYS = 1;
const DEFAULT_EASY_DAYS = 3;
const DEFAULT_MAX_INTERVAL_DAYS = 365;

export const createInitialMemorizationState = (now = Date.now()): MemorizationCardState => ({
  status: "new",
  dueAt: now,
  lastReviewedAt: null,
  intervalDays: 0,
  easeFactor: DEFAULT_EASE,
  repetitions: 0,
  lapses: 0,
  learningStep: 0,
  suspended: false
});

export const isMemorizationCardDue = (
  state: MemorizationCardState | undefined,
  now = Date.now()
) => {
  if (!state) return true;
  if (state.suspended) return false;
  return state.dueAt <= now;
};

const roundDays = (value: number) => Math.max(1, Math.round(value));

export type SchedulerOptions = Pick<
  MemorizationSettings,
  "graduatingIntervalDays" | "easyIntervalDays" | "maxIntervalDays"
>;

export const applyMemorizationReview = (
  previous: MemorizationCardState | undefined,
  rating: MemorizationRating,
  now = Date.now(),
  opts?: SchedulerOptions
): MemorizationCardState => {
  const graduatingDays = opts?.graduatingIntervalDays ?? DEFAULT_GRADUATING_DAYS;
  const easyDays = opts?.easyIntervalDays ?? DEFAULT_EASY_DAYS;
  const maxInterval = opts?.maxIntervalDays ?? DEFAULT_MAX_INTERVAL_DAYS;

  const state = previous || createInitialMemorizationState(now);

  if (rating === "again") {
    return {
      ...state,
      status: state.status === "review" ? "relearning" : "learning",
      dueAt: now + LEARNING_DELAY_MS,
      lastReviewedAt: now,
      intervalDays: 0,
      easeFactor: Math.max(MIN_EASE, state.easeFactor - 0.2),
      lapses: state.lapses + 1,
      learningStep: 0
    };
  }

  if (state.status === "new" || state.status === "learning" || state.status === "relearning") {
    if (rating === "hard") {
      return {
        ...state,
        status: "learning",
        dueAt: now + HARD_DELAY_MS,
        lastReviewedAt: now,
        intervalDays: 0,
        easeFactor: Math.max(MIN_EASE, state.easeFactor - 0.05),
        learningStep: Math.max(1, state.learningStep + 1)
      };
    }

    if (rating === "good") {
      const days = Math.min(graduatingDays, maxInterval);
      return {
        ...state,
        status: "review",
        dueAt: now + days * DAY_MS,
        lastReviewedAt: now,
        intervalDays: days,
        repetitions: state.repetitions + 1,
        learningStep: 0
      };
    }

    // easy
    const days = Math.min(easyDays, maxInterval);
    return {
      ...state,
      status: "review",
      dueAt: now + days * DAY_MS,
      lastReviewedAt: now,
      intervalDays: days,
      easeFactor: Math.min(MAX_EASE, state.easeFactor + 0.15),
      repetitions: state.repetitions + 1,
      learningStep: 0
    };
  }

  // Review card
  let easeFactor = state.easeFactor;
  let intervalDays = state.intervalDays || 1;

  if (rating === "hard") {
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
    intervalDays = roundDays(intervalDays * 1.2);
  } else if (rating === "good") {
    intervalDays = roundDays(intervalDays * easeFactor);
  } else {
    easeFactor = Math.min(MAX_EASE, easeFactor + 0.15);
    intervalDays = roundDays(intervalDays * easeFactor * 1.3);
  }

  intervalDays = Math.min(intervalDays, maxInterval);

  return {
    ...state,
    status: "review",
    dueAt: now + intervalDays * DAY_MS,
    lastReviewedAt: now,
    intervalDays,
    easeFactor,
    repetitions: state.repetitions + 1,
    learningStep: 0
  };
};

export const formatMemorizationIntervalLabel = (ms: number): string => {
  if (ms < 60 * 60 * 1000) {
    return `${Math.max(1, Math.round(ms / 60000))}m`;
  }
  if (ms < DAY_MS) {
    return `${Math.max(1, Math.round(ms / (60 * 60 * 1000)))}h`;
  }
  return `${Math.max(1, Math.round(ms / DAY_MS))}d`;
};

export const getMemorizationReviewPreview = (
  previous: MemorizationCardState | undefined,
  rating: MemorizationRating,
  opts?: SchedulerOptions
): string => {
  const nextState = applyMemorizationReview(previous, rating, 0, opts);
  return formatMemorizationIntervalLabel(nextState.dueAt);
};
