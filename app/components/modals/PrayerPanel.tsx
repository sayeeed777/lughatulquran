"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function PrayerPanel({
  isOpen,
  onClose,
  prayerSettings,
  setPrayerSettings,
  nextPrayerPreview,
  hasPrayerLocation
}: PrayerPanelProps) {
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
    const countryCode = String(prayerSettings.countryCode || "").trim();
    const query = String(prayerSettings.city || "").trim();
    if (!countryCode) {
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
  }, [isOpen, prayerSettings.city, prayerSettings.countryCode]);

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
                    <input
                      className="settings-input"
                      type="text"
                      placeholder="Start typing city..."
                      value={prayerSettings.city}
                      onChange={(event) =>
                        setPrayerSettings((prev) => ({
                          ...prev,
                          city: event.target.value,
                          latitude: null,
                          longitude: null,
                          geonameId: null
                        }))
                      }
                    />
                    <p className="settings-field-hint">
                      Choose a suggestion for exact coordinates and timezone.
                    </p>

                    {locationStatus === "loading" && (
                      <div className="prayer-city-options-status">Searching cities...</div>
                    )}
                    {locationStatus === "error" && (
                      <div className="prayer-city-options-status">
                        Unable to load city list. Please try again.
                      </div>
                    )}
                    {locationOptions.length > 0 && (
                      <div className="prayer-city-options" role="listbox" aria-label="City options">
                        {locationOptions.map((option) => (
                          <button
                            key={`${option.countryCode}-${option.city}-${option.latitude}-${option.longitude}`}
                            type="button"
                            className="prayer-city-option"
                            onClick={() => {
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
                              setLocationOptions([]);
                            }}
                          >
                            <span>{option.city}, {option.countryCode}</span>
                            <span>{option.timezone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {locationStatus === "idle"
                      && Boolean(prayerSettings.countryCode)
                      && Boolean(prayerSettings.city.trim())
                      && locationOptions.length === 0 && (
                        <div className="prayer-city-options-status">No matching city found. Try another spelling.</div>
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
