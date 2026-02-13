"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { STORAGE_KEYS } from "../lib/constants";
import type { SetState, ShortcutConfig, StudySession } from "../lib/types";

export type { StudySession };

// Validate that parsed localStorage data structurally matches the expected type
// by comparing against the initialValue's shape. Prevents corrupted/tampered data
// from crashing downstream code.
function isStructurallyCompatible(parsed: unknown, reference: unknown): boolean {
  if (reference === null || reference === undefined) {
    // When initialValue is null/undefined, accept any valid JSON value
    return true;
  }
  const refType = typeof reference;
  const parsedType = typeof parsed;

  // Primitive types must match
  if (refType !== "object") {
    return parsedType === refType;
  }
  // If reference is an object, parsed must also be a non-null object
  if (parsed === null || parsedType !== "object") {
    return false;
  }
  // Array check: both must be arrays or both must be plain objects
  if (Array.isArray(reference) !== Array.isArray(parsed)) {
    return false;
  }
  // For plain objects, verify top-level keys exist with compatible types
  if (!Array.isArray(reference)) {
    const refObj = reference as Record<string, unknown>;
    const parsedObj = parsed as Record<string, unknown>;
    for (const key of Object.keys(refObj)) {
      if (!(key in parsedObj)) return false;
      // Only check type for non-null reference values
      if (refObj[key] !== null && refObj[key] !== undefined) {
        if (typeof parsedObj[key] !== typeof refObj[key]) return false;
      }
    }
  }
  return true;
}

// Hook for localStorage with SSR safety and structural validation
export function useLocalStorage<T>(key: string, initialValue: T): [T, SetState<T>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed: unknown = JSON.parse(item);
        if (parsed !== null && parsed !== undefined) {
          if (isStructurallyCompatible(parsed, initialValue)) {
            setStoredValue(parsed as T);
          } else {
            // Data shape doesn't match expected type — discard it
            localStorage.removeItem(key);
          }
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
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps -- initialValue is stable

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
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Extract primitive values for stable dependency comparison
  const threshold = Array.isArray(options.threshold) ? options.threshold.join(",") : options.threshold;
  const rootMargin = options.rootMargin;

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setIsIntersecting(entry.isIntersecting);
      }
    }, {
      threshold: 0.5,
      ...optionsRef.current
    });

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);

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
