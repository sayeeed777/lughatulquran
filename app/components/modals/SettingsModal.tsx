"use client";

import { memo, useState, useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PRAYER_COUNTRIES, PRAYER_MADHABS, PRAYER_METHODS } from "../../lib/constants";
import type {
  NextPrayerPreview,
  PrayerLocationOption,
  PrayerSettings,
  SettingsTabId
} from "../../lib/types";
import {
  PremiumSlider,
  ReciterCard,
  SETTINGS_TABS,
  SettingsSection,
  TranslationChips,
  type Option,
  type Reciter
} from "./SettingsModalParts";

type ArabicFont = { id: string; label: string; css?: string };

type FontScale = { arabic: number; translation: number };

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTabId;
  onTabChange?: (tab: SettingsTabId) => void;
  translations: Option[];
  selectedTranslations?: string[];
  setSelectedTranslations: Dispatch<SetStateAction<string[]>>;
  showTransliteration: boolean;
  setShowTransliteration: Dispatch<SetStateAction<boolean>>;
  fontScale: FontScale;
  setFontScale: Dispatch<SetStateAction<FontScale>>;
  reciters: Reciter[];
  reciterId: string;
  setReciterId: Dispatch<SetStateAction<string>>;
  arabicFonts: ArabicFont[];
  arabicFontId: string;
  setArabicFontId: Dispatch<SetStateAction<string>>;
  prayerSettings: PrayerSettings;
  setPrayerSettings: Dispatch<SetStateAction<PrayerSettings>>;
  nextPrayerPreview: NextPrayerPreview | null;
  hasPrayerLocation: boolean;
  clamp: (value: number, min: number, max: number) => number;
};

type PrayerLocationSearchResponse = {
  items?: PrayerLocationOption[];
};

function SettingsModal({
  isOpen,
  onClose,
  initialTab = "display",
  onTabChange,
  // Translation
  translations,
  selectedTranslations = ["en-arberry"],
  setSelectedTranslations,
  showTransliteration,
  setShowTransliteration,
  // Font Scale
  fontScale,
  setFontScale,
  // Reciter
  reciters,
  reciterId,
  setReciterId,
  // Arabic Font
  arabicFonts,
  arabicFontId,
  setArabicFontId,
  // Prayer
  prayerSettings,
  setPrayerSettings,
  nextPrayerPreview,
  hasPrayerLocation,
  // Utility
  clamp
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [isMobile, setIsMobile] = useState(false);
  const [locationOptions, setLocationOptions] = useState<PrayerLocationOption[]>([]);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    setActiveTab(initialTab === "prayer" ? "display" : initialTab);
  }, [initialTab]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || activeTab !== "prayer") return;
    const countryCode = String(prayerSettings.countryCode || "").trim();
    const query = String(prayerSettings.city || "").trim();

    if (!countryCode || query.length < 2) {
      setLocationOptions([]);
      setLocationStatus("idle");
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLocationStatus("loading");
      try {
        const params = new URLSearchParams({
          countryCode,
          q: query,
          limit: "12"
        });
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
  }, [activeTab, isOpen, prayerSettings.city, prayerSettings.countryCode]);

  const handleArabicScale = useCallback(
    (val: number) => {
      setFontScale((prev) => ({ ...prev, arabic: clamp(val, 0.8, 1.4) }));
    },
    [setFontScale, clamp]
  );

  const handleTranslationScale = useCallback(
    (val: number) => {
      setFontScale((prev) => ({ ...prev, translation: clamp(val, 0.9, 1.4) }));
    },
    [setFontScale, clamp]
  );

  const handleTabSelect = useCallback(
    (tab: SettingsTabId) => {
      setActiveTab(tab);
      onTabChange?.(tab);
    },
    [onTabChange]
  );

  // Animation variants for mobile (slide up) vs desktop (fade only)
  // Desktop uses opacity-only so Framer Motion doesn't set an inline transform
  // that would override the CSS transform: translate(-50%, -50%) centering.
  const modalVariants = {
    hidden: isMobile
      ? { opacity: 0, y: "100%" }
      : { opacity: 0 },
    visible: isMobile
      ? { opacity: 1, y: 0 }
      : { opacity: 1 },
    exit: isMobile
      ? { opacity: 0, y: "100%" }
      : { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="settings-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              type: "spring",
              stiffness: isMobile ? 300 : 400,
              damping: isMobile ? 35 : 30
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="settings-header">
              <h3 className="settings-title">Settings</h3>
              <motion.button
                className="settings-close-btn"
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </motion.button>
            </div>

            {/* Tab Switcher */}
            <div className="settings-tabs">
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => handleTabSelect(tab.id as SettingsTabId)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      className="tab-indicator"
                      layoutId="tab-indicator"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <motion.div className="settings-content">
              <AnimatePresence mode="wait">
                {activeTab === "display" && (
                  <motion.div
                    key="display"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    className="settings-tab-content"
                  >
                    <SettingsSection title="Reading" delay={0}>
                      <label className="study-premium-toggle">
                        <span className="toggle-info">
                          <span className="toggle-icon" aria-hidden="true">
                            Aa
                          </span>
                          <span className="toggle-label">Show transliteration (Reader)</span>
                        </span>
                        <span className={`toggle-switch ${showTransliteration ? "active" : ""}`}>
                          <input
                            type="checkbox"
                            checked={showTransliteration}
                            onChange={(event) => setShowTransliteration(event.target.checked)}
                            aria-label="Show English transliteration"
                          />
                          <span className="toggle-slider" aria-hidden="true" />
                        </span>
                      </label>
                    </SettingsSection>

                    {/* Translation Section */}
                    <SettingsSection title="Translations" delay={0.05}>
                      <TranslationChips
                        options={translations || []}
                        selectedIds={selectedTranslations}
                        onChange={setSelectedTranslations}
                        defaultId="en-arberry"
                        className="translation-chips-scroll"
                      />
                    </SettingsSection>

                    {/* Arabic Font Section */}
                    <SettingsSection title="Arabic Font" delay={0.1}>
                      <select
                        className="settings-select"
                        value={arabicFontId}
                        onChange={(e) => setArabicFontId(e.target.value)}
                      >
                        {(arabicFonts || []).map((font) => (
                          <option key={font.id} value={font.id}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </SettingsSection>

                    {/* Text Size Section */}
                    <SettingsSection title="Text Size" delay={0.15}>
                      <PremiumSlider
                        label="Arabic"
                        icon="ع"
                        value={fontScale.arabic}
                        min={0.8}
                        max={1.4}
                        step={0.05}
                        onChange={handleArabicScale}
                      />
                      <PremiumSlider
                        label="Translation"
                        icon="A"
                        value={fontScale.translation}
                        min={0.9}
                        max={1.4}
                        step={0.05}
                        onChange={handleTranslationScale}
                      />
                    </SettingsSection>
                  </motion.div>
                )}

                {activeTab === "audio" && (
                  <motion.div
                    key="audio"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="settings-tab-content"
                  >
                    {/* Reciter Section */}
                    <SettingsSection title="Reciter" delay={0}>
                      <div className="reciter-grid">
                        {(reciters || []).map((reciter, index) => (
                          <motion.div
                            key={reciter.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <ReciterCard
                              reciter={reciter}
                              isSelected={reciterId === reciter.id}
                              onSelect={setReciterId}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </SettingsSection>
                  </motion.div>
                )}

                {activeTab === "prayer" && (
                  <motion.div
                    key="prayer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="settings-tab-content"
                  >
                    <SettingsSection title="Location" delay={0}>
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
                          Select from suggestions to lock exact GeoNames coordinates.
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
                      </label>
                    </SettingsSection>

                    <SettingsSection title="Calculation" delay={0.05}>
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
                    </SettingsSection>

                    <SettingsSection title="Next Prayer" delay={0.1}>
                      <div className="prayer-preview-card">
                        <p className="prayer-preview-main">
                          {hasPrayerLocation && nextPrayerPreview
                            ? `${nextPrayerPreview.name} - ${nextPrayerPreview.time}`
                            : "Set country and city to preview next prayer"}
                        </p>
                        <p className="prayer-preview-sub">
                          {hasPrayerLocation
                            ? prayerSettings.geonameId
                              ? `${prayerSettings.city}, ${prayerSettings.countryCode} • GeoNames #${prayerSettings.geonameId}`
                              : `${prayerSettings.city}, ${prayerSettings.countryCode}`
                            : "Location options are kept here to avoid clutter on the reader."}
                        </p>
                      </div>
                    </SettingsSection>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Footer hint */}
            <div className="settings-footer">
              <span className="settings-hint">
                {isMobile ? "Tap outside to close" : "Press ESC to close"}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default memo(SettingsModal);
