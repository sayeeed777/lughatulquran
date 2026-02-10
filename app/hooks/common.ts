"use client";

import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "../lib/constants";
import type { SetState, ShortcutConfig, StudySession } from "../lib/types";

export type { StudySession };

// Hook for localStorage with SSR safety and parse validation
export function useLocalStorage<T>(key: string, initialValue: T): [T, SetState<T>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed: unknown = JSON.parse(item);
        // Basic structural validation: reject primitives when expecting objects and vice-versa
        if (parsed !== null && parsed !== undefined) {
          setStoredValue(parsed as T);
        }
      }
    } catch {
      // Malformed or tampered data — fall back to initialValue
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore storage errors
      }
    }
    setIsLoaded(true);
  }, [key]);

  const setValue = useCallback<SetState<T>>(
    (value) => {
      setStoredValue((prevValue) => {
        try {
          const valueToStore = value instanceof Function ? value(prevValue) : value;
          if (typeof window !== "undefined") {
            localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        } catch {
          return prevValue;
        }
      });
    },
    [key]
  );

  return [storedValue, setValue, isLoaded];
}

// Hook for tracking last read position
export function useLastRead() {
  const [lastRead, setLastRead] = useLocalStorage(STORAGE_KEYS.lastRead, null as null | {
    surah: number;
    ayah: number;
    surahName: string;
    timestamp: number;
  });

  const updateLastRead = useCallback(
    (surahNumber: number, ayahNumber: number, surahName: string) => {
      setLastRead({
        surah: surahNumber,
        ayah: ayahNumber,
        surahName,
        timestamp: Date.now()
      });
    },
    [setLastRead]
  );

  return { lastRead, updateLastRead };
}

export function useStudySession() {
  const [studySession, setStudySession] = useLocalStorage(
    STORAGE_KEYS.studySession,
    null as StudySession | null
  );

  const updateStudySession = useCallback(
    (payload: Omit<StudySession, "updatedAt">) => {
      setStudySession({
        ...payload,
        updatedAt: Date.now()
      });
    },
    [setStudySession]
  );

  return { studySession, updateStudySession };
}

// Hook for keyboard shortcuts (properly typed)
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // Don't trigger shortcuts when typing in inputs
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      for (const [, config] of Object.entries(shortcuts)) {
        const keys = Array.isArray(config) ? config : config?.keys;
        if (!Array.isArray(keys)) continue;
        if (keys.includes(event.key)) {
          event.preventDefault();
          const handler = Array.isArray(config) ? null : config?.handler;
          if (typeof handler === "function") {
            handler(event);
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}

// Hook for intersection observer
export function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const [ref, setRef] = useState<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setIsIntersecting(entry.isIntersecting);
      }
    }, {
      threshold: 0.5,
      ...options
    });

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);

  return [setRef, isIntersecting] as const;
}

// Hook for debounced value
export function useDebounce<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Hook for window size (with throttle)
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let rafId: number | null = null;

    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    const handleResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        updateSize();
        rafId = null;
      });
    };

    updateSize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return size;
}
