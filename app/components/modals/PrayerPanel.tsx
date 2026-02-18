"use client";

import { useEffect, useMemo, useRef, useState, useCallback, type KeyboardEvent as ReactKeyboardEvent } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { PRAYER_COUNTRIES, PRAYER_MADHABS, PRAYER_METHODS } from "../../lib/constants";
import type { NextPrayerPreview, PrayerLocationOption } from "../../lib/types";
import { usePreferences } from "../../contexts";

/* ── Custom Select Dropdown ── */

type SelectOption = { value: string; label: string };

type PrayerSelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
};

function PrayerSelect({
  options,
  value,
  onChange,
  placeholder = "Select",
  searchable = false,
  searchPlaceholder = "Search…"
}: PrayerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder;

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search, searchable]);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setHighlightIndex(-1);
      // Focus the search input after animation
      if (searchable) {
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    }
  }, [isOpen, searchable]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  const select = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          select(filtered[highlightIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  return (
    <div
      className="prayer-custom-select"
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={`prayer-custom-trigger${isOpen ? " open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`prayer-custom-trigger-text${!value ? " placeholder" : ""}`}>
          {selectedLabel}
        </span>
        <svg
          className={`prayer-custom-chevron${isOpen ? " rotated" : ""}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="prayer-custom-dropdown"
            role="listbox"
            initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {searchable && (
              <div className="prayer-custom-search-wrap">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="prayer-custom-search"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightIndex(0);
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}
            <div className="prayer-custom-options" ref={listRef}>
              {filtered.length === 0 && (
                <div className="prayer-custom-no-match">No match found</div>
              )}
              {filtered.map((opt, idx) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  className={`prayer-custom-option${opt.value === value ? " selected" : ""}${idx === highlightIndex ? " highlighted" : ""}`}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(opt.value)}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Prayer Panel ── */

type PrayerPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

type PrayerLocationSearchResponse = {
  items?: PrayerLocationOption[];
};

type PrayerTiming = {
  time?: string;
  display?: string;
};

type PrayerTimesResponse = {
  timings?: Record<string, PrayerTiming>;
  nextPrayer?: {
    name?: string;
    time?: string;
    display?: string;
  };
  location?: {
    city?: string;
    countryCode?: string;
    geonameId?: number | null;
    timezone?: string;
  };
};

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
const RECENT_LOCATIONS_KEY = "quran.prayer_recent_locations.v1";
const MAX_RECENT_LOCATIONS = 5;

const isValidLocationOption = (value: unknown): value is PrayerLocationOption => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.countryCode === "string"
    && typeof record.country === "string"
    && typeof record.city === "string"
    && typeof record.timezone === "string"
    && typeof record.latitude === "number"
    && Number.isFinite(record.latitude)
    && typeof record.longitude === "number"
    && Number.isFinite(record.longitude)
    && (record.geonameId === null || typeof record.geonameId === "number")
  );
};

export default function PrayerPanel({
  isOpen,
  onClose
}: PrayerPanelProps) {
  const { prayerSettings, setPrayerSettings, nextPrayerPreview, hasPrayerLocation } = usePreferences();
  const [cityInput, setCityInput] = useState("");
  const [isCityFocused, setIsCityFocused] = useState(false);
  const [highlightedCityIndex, setHighlightedCityIndex] = useState(-1);
  const [recentLocations, setRecentLocations] = useState<PrayerLocationOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<PrayerLocationOption[]>([]);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "error">("idle");
  const [timings, setTimings] = useState<Record<string, PrayerTiming>>({});
  const [timingStatus, setTimingStatus] = useState<"idle" | "loading" | "error">("idle");
  const [, setResolvedMeta] = useState<PrayerTimesResponse["location"] | null>(null);
  const [nextPrayerFromApi, setNextPrayerFromApi] = useState<NextPrayerPreview | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setCityInput(String(prayerSettings.city || "").trim());
    setIsCityFocused(false);
    setHighlightedCityIndex(-1);
  }, [isOpen, prayerSettings.city]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(RECENT_LOCATIONS_KEY);
      if (!raw) {
        setRecentLocations([]);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        setRecentLocations([]);
        return;
      }
      setRecentLocations(parsed.filter(isValidLocationOption).slice(0, MAX_RECENT_LOCATIONS));
    } catch {
      setRecentLocations([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const countryCode = String(prayerSettings.countryCode || "").trim();
    const query = String(cityInput || "").trim();
    if (!countryCode) {
      setLocationStatus("idle");
      setLocationOptions([]);
      return;
    }
    if (query.length === 1) {
      setLocationStatus("idle");
      setLocationOptions([]);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLocationStatus("loading");
      try {
        const params = new URLSearchParams({
          countryCode,
          limit: query ? "12" : "20"
        });
        if (query) params.set("q", query);
        const response = await fetch(`/api/prayer-locations?${params.toString()}`, {
          signal: abortController.signal
        });
        if (!response.ok) {
          setLocationStatus("error");
          setLocationOptions([]);
          return;
        }
        const payload = (await response.json()) as PrayerLocationSearchResponse;
        setLocationOptions(Array.isArray(payload?.items) ? payload.items : []);
        setLocationStatus("idle");
      } catch {
        if (abortController.signal.aborted) return;
        setLocationStatus("error");
        setLocationOptions([]);
      }
    }, 220);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [cityInput, isOpen, prayerSettings.countryCode]);

  useEffect(() => {
    setHighlightedCityIndex((prev) => {
      if (locationOptions.length === 0) return -1;
      if (prev < 0) return 0;
      return Math.min(prev, locationOptions.length - 1);
    });
  }, [locationOptions]);

  useEffect(() => {
    if (!isOpen || !hasPrayerLocation) {
      setTimings({});
      setResolvedMeta(null);
      setNextPrayerFromApi(null);
      setTimingStatus("idle");
      return;
    }

    const abortController = new AbortController();
    const params = new URLSearchParams({
      countryCode: String(prayerSettings.countryCode || "").trim(),
      city: String(prayerSettings.city || "").trim(),
      timezone: String(prayerSettings.timezone || "").trim(),
      method: String(prayerSettings.method || "MWL"),
      madhab: String(prayerSettings.madhab || "SHAFI")
    });

    if (Number.isFinite(prayerSettings.latitude) && Number.isFinite(prayerSettings.longitude)) {
      params.set("latitude", String(prayerSettings.latitude));
      params.set("longitude", String(prayerSettings.longitude));
    }

    const loadTimings = async () => {
      setTimingStatus("loading");
      try {
        const response = await fetch(`/api/prayer-times?${params.toString()}`, {
          signal: abortController.signal,
          cache: "no-store"
        });
        if (!response.ok) {
          setTimingStatus("error");
          setTimings({});
          setResolvedMeta(null);
          setNextPrayerFromApi(null);
          return;
        }

        const payload = (await response.json()) as PrayerTimesResponse;
        setTimings(payload?.timings || {});
        setResolvedMeta(payload?.location || null);
        const nextName = String(payload?.nextPrayer?.name || "").trim();
        const nextTime = String(payload?.nextPrayer?.display || payload?.nextPrayer?.time || "").trim();
        if (nextName && nextTime) {
          setNextPrayerFromApi({
            name: nextName,
            time: nextTime
          });
        } else {
          setNextPrayerFromApi(null);
        }
        setTimingStatus("idle");
      } catch {
        if (abortController.signal.aborted) return;
        setTimingStatus("error");
        setTimings({});
        setResolvedMeta(null);
        setNextPrayerFromApi(null);
      }
    };

    loadTimings();

    return () => {
      abortController.abort();
    };
  }, [
    hasPrayerLocation,
    isOpen,
    prayerSettings.city,
    prayerSettings.countryCode,
    prayerSettings.latitude,
    prayerSettings.longitude,
    prayerSettings.madhab,
    prayerSettings.method,
    prayerSettings.timezone
  ]);

  const activeNextPrayer = nextPrayerFromApi || nextPrayerPreview;
  const timingRows = useMemo(
    () =>
      PRAYER_ORDER.map((name) => {
        const entry = timings[name] || {};
        const display = String(entry.display || entry.time || "--").trim() || "--";
        return { name, display };
      }),
    [timings]
  );
  const countryOptions = useMemo<SelectOption[]>(
    () => PRAYER_COUNTRIES.map((c) => ({ value: c.code, label: c.name })),
    []
  );
  const methodOptions = useMemo<SelectOption[]>(
    () => PRAYER_METHODS.map((m) => ({ value: m.id, label: m.label })),
    []
  );
  const madhabOptions = useMemo<SelectOption[]>(
    () => PRAYER_MADHABS.map((m) => ({ value: m.id, label: m.label })),
    []
  );

  const handleCountryChange = useCallback(
    (code: string) => {
      const country = PRAYER_COUNTRIES.find((item) => item.code === code);
      setPrayerSettings((prev) => ({
        ...prev,
        countryCode: code,
        countryName: country?.name || "",
        city: "",
        latitude: null,
        longitude: null,
        geonameId: null
      }));
      setCityInput("");
      setIsCityFocused(false);
      setHighlightedCityIndex(-1);
      setLocationOptions([]);
    },
    [setPrayerSettings]
  );

  const handleMethodChange = useCallback(
    (value: string) => setPrayerSettings((prev) => ({ ...prev, method: value })),
    [setPrayerSettings]
  );

  const handleMadhabChange = useCallback(
    (value: string) => setPrayerSettings((prev) => ({ ...prev, madhab: value })),
    [setPrayerSettings]
  );

  const trimmedCityInput = cityInput.trim();
  const recentInCountry = useMemo(
    () =>
      recentLocations.filter((item) =>
        !prayerSettings.countryCode || item.countryCode === prayerSettings.countryCode
      ),
    [prayerSettings.countryCode, recentLocations]
  );
  const showRecentLocations = Boolean(
    isCityFocused
    && prayerSettings.countryCode
    && !trimmedCityInput
    && locationStatus !== "loading"
    && recentInCountry.length > 0
  );
  const showCityResults = Boolean(
    isCityFocused
    && prayerSettings.countryCode
    && !showRecentLocations
    && locationOptions.length > 0
  );
  const showNoMatch = Boolean(
    isCityFocused
    && locationStatus === "idle"
    && prayerSettings.countryCode
    && trimmedCityInput.length >= 2
    && locationOptions.length === 0
  );

  const rememberRecentLocation = (option: PrayerLocationOption) => {
    setRecentLocations((prev) => {
      const filtered = prev.filter((item) =>
        item.geonameId != null && option.geonameId != null
          ? item.geonameId !== option.geonameId
          : !(item.countryCode === option.countryCode && item.city === option.city)
      );
      const next = [option, ...filtered].slice(0, MAX_RECENT_LOCATIONS);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage restrictions.
        }
      }
      return next;
    });
  };

  const applyLocationOption = (option: PrayerLocationOption) => {
    setPrayerSettings((prev) => ({
      ...prev,
      countryCode: option.countryCode,
      countryName: option.country,
      city: option.city,
      timezone: option.timezone || prev.timezone,
      latitude: option.latitude,
      longitude: option.longitude,
      geonameId: option.geonameId
    }));
    setCityInput(option.city);
    setLocationOptions([]);
    setIsCityFocused(false);
    setHighlightedCityIndex(-1);
    rememberRecentLocation(option);
  };

  const handleCityInputBlur = () => {
    window.setTimeout(() => {
      setIsCityFocused(false);
      setHighlightedCityIndex(-1);
    }, 120);
  };

  const handleCityInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      if (!locationOptions.length) return;
      event.preventDefault();
      setHighlightedCityIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, locationOptions.length - 1);
      });
      return;
    }

    if (event.key === "ArrowUp") {
      if (!locationOptions.length) return;
      event.preventDefault();
      setHighlightedCityIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter" && highlightedCityIndex >= 0 && highlightedCityIndex < locationOptions.length) {
      event.preventDefault();
      applyLocationOption(locationOptions[highlightedCityIndex]);
      return;
    }

    if (event.key === "Escape") {
      setIsCityFocused(false);
      setHighlightedCityIndex(-1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="prayer-floating-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.aside
            className="prayer-floating-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Prayer times"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="prayer-floating-header">
              <div>
                <h3 className="prayer-floating-title">Prayer Times</h3>
                <p className="prayer-floating-subtitle">
                  {hasPrayerLocation
                    ? `${prayerSettings.city}, ${prayerSettings.countryName || prayerSettings.countryCode}`
                    : "Set your location below"}
                </p>
              </div>
              <button
                type="button"
                className="prayer-floating-close"
                aria-label="Close prayer panel"
                onClick={onClose}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>

            <div className="prayer-floating-body">
              {/* ── Hero: Next Prayer ── */}
              <div className="prayer-hero-card">
                {activeNextPrayer ? (
                  <>
                    <span className="prayer-hero-label">Next Prayer</span>
                    <span className="prayer-hero-name">{activeNextPrayer.name}</span>
                    <span className="prayer-hero-time">{activeNextPrayer.time}</span>
                  </>
                ) : (
                  <>
                    <span className="prayer-hero-label">Next Prayer</span>
                    <span className="prayer-hero-empty">Set your location to get started</span>
                  </>
                )}
              </div>

              {/* ── Today's Schedule ── */}
              <section className="prayer-section">
                <h4 className="prayer-section-title">Today</h4>
                <div className="prayer-schedule-card">
                  {!hasPrayerLocation && (
                    <p className="prayer-schedule-empty">
                      Select a country and city to see prayer times.
                    </p>
                  )}
                  {hasPrayerLocation && timingStatus === "loading" && (
                    <p className="prayer-schedule-empty">Calculating…</p>
                  )}
                  {hasPrayerLocation && timingStatus === "error" && (
                    <p className="prayer-schedule-empty">Unable to load times right now.</p>
                  )}
                  {hasPrayerLocation && timingStatus === "idle" && (
                    <div className="prayer-schedule-list">
                      {timingRows.map((row, idx) => {
                        const isNext = activeNextPrayer?.name?.toLowerCase() === row.name.toLowerCase();
                        return (
                          <div
                            key={row.name}
                            className={`prayer-schedule-row${isNext ? " active" : ""}${idx === 0 ? " first" : ""}${idx === timingRows.length - 1 ? " last" : ""}`}
                          >
                            <span className="prayer-schedule-name">{row.name}</span>
                            <span className="prayer-schedule-time">{row.display}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* ── Location ── */}
              <section className="prayer-section">
                <h4 className="prayer-section-title">Location</h4>
                <div className="prayer-settings-card">
                  <div className="prayer-settings-row">
                    <span className="prayer-settings-label">Country</span>
                    <PrayerSelect
                      options={countryOptions}
                      value={prayerSettings.countryCode}
                      onChange={handleCountryChange}
                      placeholder="Select"
                      searchable
                      searchPlaceholder="Search country…"
                    />
                  </div>

                  <div className="prayer-settings-divider" />

                  <div className="prayer-settings-row prayer-city-row">
                    <span className="prayer-settings-label">City</span>
                    <div className="prayer-city-input-shell">
                      <span className="prayer-city-input-icon" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                      </span>
                      <input
                        className="prayer-city-input"
                        type="text"
                        role="combobox"
                        aria-expanded={showCityResults || showRecentLocations}
                        aria-controls={showCityResults || showRecentLocations ? "prayer-city-options" : undefined}
                        aria-activedescendant={showCityResults && highlightedCityIndex >= 0
                          ? `prayer-city-option-${highlightedCityIndex}`
                          : undefined}
                        placeholder={prayerSettings.countryCode ? "Search…" : "Select country first"}
                        value={cityInput}
                        onFocus={() => setIsCityFocused(true)}
                        onBlur={handleCityInputBlur}
                        onKeyDown={handleCityInputKeyDown}
                        onChange={(event) => {
                          setCityInput(event.target.value);
                          setIsCityFocused(true);
                          setHighlightedCityIndex(-1);
                        }}
                        autoComplete="off"
                        spellCheck={false}
                        disabled={!prayerSettings.countryCode}
                      />
                      {cityInput && (
                        <button
                          type="button"
                          className="prayer-city-clear-btn"
                          aria-label="Clear city search"
                          onClick={() => {
                            setCityInput("");
                            setHighlightedCityIndex(-1);
                            setLocationOptions([]);
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {prayerSettings.geonameId && (
                    <div className="prayer-city-selected-pill">
                      <span className="prayer-city-selected-main">
                        {prayerSettings.city}, {prayerSettings.countryCode}
                      </span>
                      <span className="prayer-city-selected-meta">
                        {prayerSettings.timezone}
                      </span>
                    </div>
                  )}

                  {locationStatus === "loading" && isCityFocused && (
                    <div className="prayer-city-options-status">Searching cities…</div>
                  )}
                  {locationStatus === "error" && (
                    <div className="prayer-city-options-status">
                      Unable to load city list. Check connection and try again.
                    </div>
                  )}

                  {showRecentLocations && (
                    <div className="prayer-city-options" role="listbox" aria-label="Recent city options" id="prayer-city-options">
                      <p className="prayer-city-options-head">Recent</p>
                      {recentInCountry.map((option) => (
                        <button
                          key={`recent-${option.countryCode}-${option.city}-${option.latitude}-${option.longitude}`}
                          type="button"
                          className="prayer-city-option"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyLocationOption(option)}
                        >
                          <span className="prayer-city-option-main">{option.city}, {option.countryCode}</span>
                          <span className="prayer-city-option-meta">{option.timezone}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showCityResults && (
                    <div className="prayer-city-options" role="listbox" aria-label="City options" id="prayer-city-options">
                      <p className="prayer-city-options-head">
                        {trimmedCityInput ? "Suggestions" : "Popular cities"}
                      </p>
                      {locationOptions.map((option, index) => (
                        <button
                          key={`${option.countryCode}-${option.city}-${option.latitude}-${option.longitude}`}
                          type="button"
                          id={`prayer-city-option-${index}`}
                          className={`prayer-city-option${highlightedCityIndex === index ? " active" : ""}`}
                          onMouseDown={(event) => event.preventDefault()}
                          onMouseEnter={() => setHighlightedCityIndex(index)}
                          onClick={() => applyLocationOption(option)}
                        >
                          <span className="prayer-city-option-main">{option.city}, {option.countryCode}</span>
                          <span className="prayer-city-option-meta">
                            {option.timezone}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showNoMatch && (
                    <div className="prayer-city-options-status">
                      No matching city found. Try another spelling or a nearby major city.
                    </div>
                  )}
                </div>
              </section>

              {/* ── Calculation Settings ── */}
              <section className="prayer-section">
                <h4 className="prayer-section-title">Calculation</h4>
                <div className="prayer-settings-card">
                  <div className="prayer-settings-row">
                    <span className="prayer-settings-label">Method</span>
                    <PrayerSelect
                      options={methodOptions}
                      value={prayerSettings.method}
                      onChange={handleMethodChange}
                    />
                  </div>

                  <div className="prayer-settings-divider" />

                  <div className="prayer-settings-row">
                    <span className="prayer-settings-label">Madhab</span>
                    <PrayerSelect
                      options={madhabOptions}
                      value={prayerSettings.madhab}
                      onChange={handleMadhabChange}
                    />
                  </div>

                  <div className="prayer-settings-divider" />

                  <label className="prayer-settings-row">
                    <span className="prayer-settings-label">Timezone</span>
                    <input
                      className="prayer-settings-input"
                      type="text"
                      placeholder="Area/City"
                      value={prayerSettings.timezone}
                      onChange={(event) =>
                        setPrayerSettings((prev) => ({
                          ...prev,
                          timezone: event.target.value
                        }))
                      }
                    />
                  </label>
                </div>
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
