"use client";

import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "../lib/constants";

// Hook for localStorage with SSR safety
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const item = localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    setIsLoaded(true);
  }, [key]);

  const setValue = useCallback((value) => {
    setStoredValue((prevValue) => {
      try {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        if (typeof window !== "undefined") {
          localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        return valueToStore;
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
        return prevValue;
      }
    });
  }, [key]);

  return [storedValue, setValue, isLoaded];
}

// Hook for tracking last read position
export function useLastRead() {
  const [lastRead, setLastRead] = useLocalStorage(STORAGE_KEYS.lastRead, null);

  const updateLastRead = useCallback((surahNumber, ayahNumber, surahName) => {
    setLastRead({
      surah: surahNumber,
      ayah: ayahNumber,
      surahName,
      timestamp: Date.now()
    });
  }, [setLastRead]);

  return { lastRead, updateLastRead };
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.tagName === "SELECT"
      ) {
        return;
      }

      for (const [action, config] of Object.entries(shortcuts)) {
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

// Hook for intersection observer (for lazy loading and tracking)
export function useIntersectionObserver(options = {}) {
  const [ref, setRef] = useState(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, {
      threshold: 0.5,
      ...options
    });

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);

  return [setRef, isIntersecting];
}

// Hook for audio playback
export function useAudioPlayer(initialSrc = null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((prev) => !prev), []);

  return {
    isPlaying,
    currentTime,
    duration,
    error,
    play,
    pause,
    toggle
  };
}

// Hook for debounced value
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Hook for window size
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}
