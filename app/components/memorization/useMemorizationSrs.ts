"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "../../hooks";
import { STORAGE_KEYS } from "../../lib/constants";
import {
  applyMemorizationReview,
  createInitialMemorizationState,
  isMemorizationCardDue,
  type SchedulerOptions
} from "../../lib/memorizationScheduler";
import type {
  MemorizationCard,
  MemorizationCardState,
  MemorizationDeckResponse,
  MemorizationProgressStore,
  MemorizationRating,
  MemorizationSettings
} from "../../lib/types";

export const DEFAULT_MEMORIZATION_SETTINGS: MemorizationSettings = {
  newCardsPerDay: 20,
  maxReviewsPerDay: 200,
  learningStepsMinutes: [1, 10],
  graduatingIntervalDays: 1,
  easyIntervalDays: 3,
  maxIntervalDays: 365,
  leechThreshold: 8,
  autoSuspendLeeches: false
};

export type SessionStats = {
  reviewed: number;
  completed: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  totalTimeMs: number;
};

export type MasteryBreakdown = {
  newCount: number;
  learningCount: number;
  reviewingCount: number;
  memorizedCount: number;
  suspendedCount: number;
  total: number;
};

export type SessionHistoryEntry = {
  date: string; // YYYY-MM-DD
  reviewed: number;
  completed: number;
  againCount: number;
};

const EMPTY_MEMORIZATION_STATE: MemorizationCardState = createInitialMemorizationState(0);

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const saveSessionToHistory = (stats: SessionStats) => {
  if (stats.reviewed === 0) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.memorizationSessionHistory);
    const history: SessionHistoryEntry[] = raw ? JSON.parse(raw) : [];
    const today = todayKey();
    const existing = history.find((e) => e.date === today);
    if (existing) {
      existing.reviewed += stats.reviewed;
      existing.completed += stats.completed;
      existing.againCount += stats.againCount;
    } else {
      history.push({ date: today, reviewed: stats.reviewed, completed: stats.completed, againCount: stats.againCount });
    }
    // Keep last 30 days
    const cutoff = history.length > 30 ? history.slice(-30) : history;
    localStorage.setItem(STORAGE_KEYS.memorizationSessionHistory, JSON.stringify(cutoff));
  } catch { /* ignore */ }
};

const getSessionHistory = (): SessionHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.memorizationSessionHistory);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const insertLater = (queue: string[], cardId: string) => {
  const next = [...queue];
  const index = Math.min(2, next.length);
  next.splice(index, 0, cardId);
  return next;
};

type UndoSnapshot = {
  cardId: string;
  previousState: MemorizationCardState | undefined;
  previousQueue: string[];
  previousStats: SessionStats;
};

export default function useMemorizationSrs(deck: MemorizationDeckResponse | null) {
  const [settings, setSettings] = useLocalStorage<MemorizationSettings>(
    STORAGE_KEYS.memorizationSettings,
    DEFAULT_MEMORIZATION_SETTINGS
  );
  const [progress, setProgress] = useLocalStorage<MemorizationProgressStore>(
    STORAGE_KEYS.memorizationProgress,
    {}
  );
  const [sessionQueue, setSessionQueue] = useState<string[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ reviewed: 0, completed: 0, againCount: 0, hardCount: 0, goodCount: 0, easyCount: 0, totalTimeMs: 0 });
  const [cardStartTime, setCardStartTime] = useState(() => Date.now());
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryEntry[]>(() => getSessionHistory());
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);

  useEffect(() => {
    setCurrentTime(Date.now());
  }, [deck?.cards, progress]);

  const cardMap = useMemo(
    () => new Map((deck?.cards || []).map((card) => [card.id, card])),
    [deck?.cards]
  );

  // Auto-stop session when deck changes
  useEffect(() => {
    if (sessionActive) {
      setSessionActive(false);
      setSessionQueue([]);
      setShowAnswer(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck?.deck.scopeMode, deck?.deck.scopeId, deck?.deck.cardMode]);

  // Auto-save session history when queue empties naturally
  const prevQueueLenRef = useRef(0);
  useEffect(() => {
    if (sessionActive && prevQueueLenRef.current > 0 && sessionQueue.length === 0 && sessionStats.reviewed > 0) {
      saveSessionToHistory(sessionStats);
      setSessionHistory(getSessionHistory());
    }
    prevQueueLenRef.current = sessionQueue.length;
  }, [sessionActive, sessionQueue.length, sessionStats]);

  const getCardState = useCallback(
    (card: MemorizationCard): MemorizationCardState => progress[card.id] || EMPTY_MEMORIZATION_STATE,
    [progress]
  );

  const counts = useMemo(() => {
    const cards = deck?.cards || [];
    let newCount = 0;
    let learningCount = 0;
    let reviewDueCount = 0;
    let suspendedCount = 0;

    cards.forEach((card) => {
      const state = progress[card.id];
      if (!state) {
        newCount += 1;
        return;
      }
      if (state.suspended) {
        suspendedCount += 1;
        return;
      }
      if ((state.status === "learning" || state.status === "relearning") && isMemorizationCardDue(state, currentTime)) {
        learningCount += 1;
        return;
      }
      if (state.status === "review" && isMemorizationCardDue(state, currentTime)) {
        reviewDueCount += 1;
      }
    });

    return {
      newCount,
      learningCount,
      reviewDueCount,
      suspendedCount,
      dueNow: newCount + learningCount + reviewDueCount
    };
  }, [currentTime, deck?.cards, progress]);

  // Overall mastery breakdown (independent of due dates)
  const mastery = useMemo<MasteryBreakdown>(() => {
    const cards = deck?.cards || [];
    let newCount = 0;
    let learningCount = 0;
    let reviewingCount = 0;
    let memorizedCount = 0;
    let suspendedCount = 0;

    cards.forEach((card) => {
      const state = progress[card.id];
      if (!state) { newCount += 1; return; }
      if (state.suspended) { suspendedCount += 1; return; }
      if (state.status === "learning" || state.status === "relearning") { learningCount += 1; return; }
      if (state.status === "review") {
        if (state.intervalDays >= 21) { memorizedCount += 1; }
        else { reviewingCount += 1; }
        return;
      }
      newCount += 1;
    });

    return { newCount, learningCount, reviewingCount, memorizedCount, suspendedCount, total: cards.length };
  }, [deck?.cards, progress]);

  const buildQueue = useCallback(() => {
    const now = Date.now();
    const cards = deck?.cards || [];
    const dueLearning = cards
      .filter((card) => {
        const state = progress[card.id];
        return state && !state.suspended && (state.status === "learning" || state.status === "relearning") && isMemorizationCardDue(state, now);
      })
      .map((card) => card.id);

    const dueReview = cards
      .filter((card) => {
        const state = progress[card.id];
        return state && !state.suspended && state.status === "review" && isMemorizationCardDue(state, now);
      })
      .map((card) => card.id)
      .slice(0, settings.maxReviewsPerDay);

    const newCards = cards
      .filter((card) => !progress[card.id])
      .map((card) => card.id)
      .slice(0, settings.newCardsPerDay);

    return [...dueLearning, ...dueReview, ...newCards];
  }, [deck?.cards, progress, settings.maxReviewsPerDay, settings.newCardsPerDay]);

  const currentCard = sessionQueue.length ? cardMap.get(sessionQueue[0]) || null : null;

  const startSession = useCallback(() => {
    const nextQueue = buildQueue();
    setSessionQueue(nextQueue);
    setSessionActive(true);
    setShowAnswer(false);
    setSessionStats({ reviewed: 0, completed: 0, againCount: 0, hardCount: 0, goodCount: 0, easyCount: 0, totalTimeMs: 0 });
    setUndoStack([]);
    setCardStartTime(Date.now());
  }, [buildQueue]);

  const stopSession = useCallback(() => {
    // Only save if queue still has items (auto-save handles empty queue)
    if (sessionQueue.length > 0 && sessionStats.reviewed > 0) {
      saveSessionToHistory(sessionStats);
      setSessionHistory(getSessionHistory());
    }
    setSessionActive(false);
    setSessionQueue([]);
    setShowAnswer(false);
  }, [sessionStats, sessionQueue.length]);

  const revealAnswer = useCallback(() => {
    setShowAnswer(true);
  }, []);

  const rateCurrentCard = useCallback(
    (rating: MemorizationRating) => {
      const card = currentCard;
      if (!card) return;

      // Save undo snapshot
      setUndoStack((prev) => [
        ...prev.slice(-19), // keep last 20
        {
          cardId: card.id,
          previousState: progress[card.id],
          previousQueue: sessionQueue,
          previousStats: sessionStats
        }
      ]);

      const schedulerOpts: SchedulerOptions = {
        graduatingIntervalDays: settings.graduatingIntervalDays,
        easyIntervalDays: settings.easyIntervalDays,
        maxIntervalDays: settings.maxIntervalDays
      };

      let updatedState: MemorizationCardState | null = null;
      setProgress((prev) => {
        let nextState = applyMemorizationReview(prev[card.id], rating, Date.now(), schedulerOpts);
        // Auto-suspend leeches
        if (settings.autoSuspendLeeches && nextState.lapses >= settings.leechThreshold && rating === "again") {
          nextState = { ...nextState, suspended: true };
        }
        updatedState = nextState;
        return { ...prev, [card.id]: nextState };
      });

      const elapsed = Date.now() - cardStartTime;
      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        completed: prev.completed + (rating === "again" ? 0 : 1),
        againCount: prev.againCount + (rating === "again" ? 1 : 0),
        hardCount: prev.hardCount + (rating === "hard" ? 1 : 0),
        goodCount: prev.goodCount + (rating === "good" ? 1 : 0),
        easyCount: prev.easyCount + (rating === "easy" ? 1 : 0),
        totalTimeMs: prev.totalTimeMs + elapsed
      }));
      setCardStartTime(Date.now());

      setSessionQueue((prev) => {
        const [, ...rest] = prev;
        if (!updatedState) return rest;
        if ((updatedState.status === "learning" || updatedState.status === "relearning") && rating !== "easy") {
          return insertLater(rest, card.id);
        }
        return rest;
      });
      setShowAnswer(false);
    },
    [currentCard, progress, sessionQueue, sessionStats, cardStartTime, settings, setProgress]
  );

  const undoLastReview = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[prev.length - 1];
      // Restore card state
      setProgress((p) => {
        if (snapshot.previousState === undefined) {
          const next = { ...p };
          delete next[snapshot.cardId];
          return next;
        }
        return { ...p, [snapshot.cardId]: snapshot.previousState };
      });
      // Restore queue and stats
      setSessionQueue(snapshot.previousQueue);
      setSessionStats(snapshot.previousStats);
      setShowAnswer(false);
      return prev.slice(0, -1);
    });
  }, [setProgress]);

  const canUndo = undoStack.length > 0;

  const suspendCurrentCard = useCallback(() => {
    const card = currentCard;
    if (!card) return;
    setProgress((prev) => ({
      ...prev,
      [card.id]: {
        ...(prev[card.id] || createInitialMemorizationState()),
        suspended: true
      }
    }));
    setSessionQueue((prev) => prev.filter((id) => id !== card.id));
    setShowAnswer(false);
  }, [currentCard, setProgress]);

  const resetDeckProgress = useCallback(() => {
    const ids = new Set((deck?.cards || []).map((card) => card.id));
    setProgress((prev) => {
      const next: MemorizationProgressStore = {};
      for (const [key, value] of Object.entries(prev)) {
        if (!ids.has(key)) {
          next[key] = value;
        }
      }
      return next;
    });
    stopSession();
  }, [deck?.cards, setProgress, stopSession]);

  return {
    progress,
    counts,
    mastery,
    sessionHistory,
    settings,
    setSettings,
    sessionActive,
    sessionQueue,
    currentCard,
    currentCardState: currentCard ? getCardState(currentCard) : null,
    showAnswer,
    sessionStats,
    startSession,
    stopSession,
    revealAnswer,
    rateCurrentCard,
    undoLastReview,
    canUndo,
    suspendCurrentCard,
    resetDeckProgress
  };
}
