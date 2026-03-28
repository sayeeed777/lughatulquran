"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "../../hooks";
import { STORAGE_KEYS } from "../../lib/constants";
import {
  applyMemorizationReview,
  createInitialMemorizationState,
  isMemorizationCardDue
} from "../../lib/memorizationScheduler";
import type {
  MemorizationCard,
  MemorizationCardState,
  MemorizationDeckResponse,
  MemorizationProgressStore,
  MemorizationRating
} from "../../lib/types";

type SessionStats = {
  reviewed: number;
  completed: number;
  againCount: number;
};

const EMPTY_MEMORIZATION_STATE: MemorizationCardState = createInitialMemorizationState(0);

const insertLater = (queue: string[], cardId: string) => {
  const next = [...queue];
  const index = Math.min(2, next.length);
  next.splice(index, 0, cardId);
  return next;
};

export default function useMemorizationSrs(deck: MemorizationDeckResponse | null) {
  const [progress, setProgress] = useLocalStorage<MemorizationProgressStore>(
    STORAGE_KEYS.memorizationProgress,
    {}
  );
  const [sessionQueue, setSessionQueue] = useState<string[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ reviewed: 0, completed: 0, againCount: 0 });
  const [currentTime, setCurrentTime] = useState(() => Date.now());

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
      .map((card) => card.id);

    const newCards = cards
      .filter((card) => !progress[card.id])
      .map((card) => card.id);

    return [...dueLearning, ...dueReview, ...newCards];
  }, [deck?.cards, progress]);

  const currentCard = sessionQueue.length ? cardMap.get(sessionQueue[0]) || null : null;

  const startSession = useCallback(() => {
    const nextQueue = buildQueue();
    setSessionQueue(nextQueue);
    setSessionActive(true);
    setShowAnswer(false);
    setSessionStats({ reviewed: 0, completed: 0, againCount: 0 });
  }, [buildQueue]);

  const stopSession = useCallback(() => {
    setSessionActive(false);
    setSessionQueue([]);
    setShowAnswer(false);
  }, []);

  const revealAnswer = useCallback(() => {
    setShowAnswer(true);
  }, []);

  const rateCurrentCard = useCallback(
    (rating: MemorizationRating) => {
      const card = currentCard;
      if (!card) return;

      let updatedState: MemorizationCardState | null = null;
      setProgress((prev) => {
        const nextState = applyMemorizationReview(prev[card.id], rating, Date.now());
        updatedState = nextState;
        return { ...prev, [card.id]: nextState };
      });

      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        completed: prev.completed + (rating === "again" ? 0 : 1),
        againCount: prev.againCount + (rating === "again" ? 1 : 0)
      }));

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
    [currentCard, setProgress]
  );

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
    suspendCurrentCard,
    resetDeckProgress
  };
}
