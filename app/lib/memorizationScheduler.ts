import type {
  MemorizationCardState,
  MemorizationRating
} from "./types";

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const DEFAULT_EASE = 2.5;
const LEARNING_DELAY_MS = 10 * 60 * 1000;
const HARD_DELAY_MS = 20 * 60 * 1000;

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

export const applyMemorizationReview = (
  previous: MemorizationCardState | undefined,
  rating: MemorizationRating,
  now = Date.now()
): MemorizationCardState => {
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
      return {
        ...state,
        status: "review",
        dueAt: now + 86400000,
        lastReviewedAt: now,
        intervalDays: 1,
        repetitions: state.repetitions + 1,
        learningStep: 0
      };
    }

    return {
      ...state,
      status: "review",
      dueAt: now + 3 * 86400000,
      lastReviewedAt: now,
      intervalDays: 3,
      easeFactor: Math.min(MAX_EASE, state.easeFactor + 0.15),
      repetitions: state.repetitions + 1,
      learningStep: 0
    };
  }

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

  return {
    ...state,
    status: "review",
    dueAt: now + intervalDays * 86400000,
    lastReviewedAt: now,
    intervalDays,
    easeFactor,
    repetitions: state.repetitions + 1,
    learningStep: 0
  };
};

const DAY_MS = 86400000;

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
  rating: MemorizationRating
): string => {
  const nextState = applyMemorizationReview(previous, rating, 0);
  return formatMemorizationIntervalLabel(nextState.dueAt);
};
