"use client";

import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PRAYER_COUNTRIES, PRAYER_MADHABS, PRAYER_METHODS } from "../../lib/constants";
import type { NextPrayerPreview, PrayerLocationOption, PrayerSettings } from "../../lib/types";

type PrayerPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  prayerSettings: PrayerSettings;
  setPrayerSettings: Dispatch<SetStateAction<PrayerSettings>>;
  nextPrayerPreview: NextPrayerPreview | null;
  hasPrayerLocation: boolean;
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
  onClose,
  prayerSettings,
  setPrayerSettings,
  nextPrayerPreview,
  hasPrayerLocation
}: PrayerPanelProps) {
  const [cityInput, setCityInput] = useState("");
  const [isCityFocused, setIsCityFocused] = useState(false);
  const [highlightedCityIndex, setHighlightedCityIndex] = useState(-1);
  const [recentLocations, setRecentLocations] = useState<PrayerLocationOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<PrayerLocationOption[]>([]);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "error">("idle");
  const [timings, setTimings] = useState<Record<string, PrayerTiming>>({});
  const [timingStatus, setTimingStatus] = useState<"idle" | "loading" | "error">("idle");
  const [resolvedMeta, setResolvedMeta] = useState<PrayerTimesResponse["location"] | null>(null);
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
                    ? `${prayerSettings.city}, ${prayerSettings.countryCode}`
                    : "Set your location to calculate times."}
                </p>
              </div>
              <button
                type="button"
                className="prayer-floating-close"
                aria-label="Close prayer panel"
                onClick={onClose}
              >
                ✕
              </button>
            </div>

            <div className="prayer-floating-body">
              <div className="prayer-preview-card prayer-floating-next">
                <p className="prayer-preview-main">
                  {activeNextPrayer
                    ? `Next: ${activeNextPrayer.name} - ${activeNextPrayer.time}`
                    : "Set location to see next prayer"}
                </p>
                <p className="prayer-preview-sub">
                  {resolvedMeta?.geonameId
                    ? `GeoNames #${resolvedMeta.geonameId} • ${resolvedMeta.timezone || prayerSettings.timezone}`
                    : prayerSettings.timezone}
                </p>
              </div>

              <div className="prayer-floating-grid">
                <section className="prayer-floating-section">
                  <h4 className="prayer-floating-section-title">Location</h4>
                  <label className="settings-field">
                    <span className="settings-field-label">Country</span>
                    <select
                      className="settings-select"
                      value={prayerSettings.countryCode}
                      onChange={(event) => {
                        const code = event.target.value;
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
                      }}
                    >
                      <option value="">Select country</option>
                      {PRAYER_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="settings-field">
                    <span className="settings-field-label">City</span>
                    <div className="prayer-city-input-shell">
                      <span className="prayer-city-input-icon" aria-hidden="true">⌕</span>
                      <input
                        className="settings-input prayer-city-input"
                        type="text"
                        role="combobox"
                        aria-expanded={showCityResults || showRecentLocations}
                        aria-controls={showCityResults || showRecentLocations ? "prayer-city-options" : undefined}
                        aria-activedescendant={showCityResults && highlightedCityIndex >= 0
                          ? `prayer-city-option-${highlightedCityIndex}`
                          : undefined}
                        placeholder={prayerSettings.countryCode ? "Search city..." : "Select country first"}
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
                    <p className="settings-field-hint">
                      Pick from suggestions for the most accurate coordinates and timezone.
                    </p>

                    {prayerSettings.geonameId && (
                      <div className="prayer-city-selected-pill">
                        <span className="prayer-city-selected-main">
                          {prayerSettings.city}, {prayerSettings.countryCode}
                        </span>
                        <span className="prayer-city-selected-meta">
                          {prayerSettings.timezone} • GeoNames #{prayerSettings.geonameId}
                        </span>
                      </div>
                    )}

                    {locationStatus === "loading" && isCityFocused && (
                      <div className="prayer-city-options-status">Searching cities...</div>
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
                            <span className="prayer-city-option-meta">Recent • {option.timezone}</span>
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
                              {option.timezone}{option.geonameId ? ` • #${option.geonameId}` : ""}
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
                  </label>
                </section>

                <section className="prayer-floating-section">
                  <h4 className="prayer-floating-section-title">Calculation</h4>
                  <label className="settings-field">
                    <span className="settings-field-label">Method</span>
                    <select
                      className="settings-select"
                      value={prayerSettings.method}
                      onChange={(event) =>
                        setPrayerSettings((prev) => ({
                          ...prev,
                          method: event.target.value
                        }))
                      }
                    >
                      {PRAYER_METHODS.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="settings-field">
                    <span className="settings-field-label">Madhab</span>
                    <select
                      className="settings-select"
                      value={prayerSettings.madhab}
                      onChange={(event) =>
                        setPrayerSettings((prev) => ({
                          ...prev,
                          madhab: event.target.value
                        }))
                      }
                    >
                      {PRAYER_MADHABS.map((madhab) => (
                        <option key={madhab.id} value={madhab.id}>
                          {madhab.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="settings-field">
                    <span className="settings-field-label">Timezone</span>
                    <input
                      className="settings-input"
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
                </section>
              </div>

              <section className="prayer-floating-section prayer-floating-schedule">
                <h4 className="prayer-floating-section-title">Today&apos;s 5 Prayers</h4>
                {!hasPrayerLocation && (
                  <p className="prayer-floating-empty">Set country and city to load timings.</p>
                )}
                {hasPrayerLocation && timingStatus === "loading" && (
                  <p className="prayer-floating-empty">Calculating prayer times...</p>
                )}
                {hasPrayerLocation && timingStatus === "error" && (
                  <p className="prayer-floating-empty">Unable to load timings right now.</p>
                )}
                {hasPrayerLocation && timingStatus === "idle" && (
                  <div className="prayer-schedule-list">
                    {timingRows.map((row) => {
                      const isNext = activeNextPrayer?.name?.toLowerCase() === row.name.toLowerCase();
                      return (
                        <div key={row.name} className={`prayer-schedule-row${isNext ? " active" : ""}`}>
                          <span className="prayer-schedule-name">{row.name}</span>
                          <span className="prayer-schedule-time">{row.display}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
