"use client";

import { memo, useState, useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  translations: Option[];
  selectedTranslations?: string[];
  setSelectedTranslations: Dispatch<SetStateAction<string[]>>;
  fontScale: FontScale;
  setFontScale: Dispatch<SetStateAction<FontScale>>;
  reciters: Reciter[];
  reciterId: string;
  setReciterId: Dispatch<SetStateAction<string>>;
  arabicFonts: ArabicFont[];
  arabicFontId: string;
  setArabicFontId: Dispatch<SetStateAction<string>>;
  clamp: (value: number, min: number, max: number) => number;
};

function SettingsModal({
  isOpen,
  onClose,
  // Translation
  translations,
  selectedTranslations = ["en.arberry"],
  setSelectedTranslations,
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
  // Utility
  clamp
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("display");
  const [isMobile, setIsMobile] = useState(false);

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

  // Animation variants for mobile (slide up) vs desktop (scale)
  const modalVariants = {
    hidden: isMobile
      ? { opacity: 0, y: "100%" }
      : { opacity: 0, x: 20, y: 0, scale: 1 },
    visible: isMobile
      ? { opacity: 1, y: 0 }
      : { opacity: 1, x: 0, y: 0, scale: 1 },
    exit: isMobile
      ? { opacity: 0, y: "100%" }
      : { opacity: 0, x: 20, y: 0, scale: 1 }
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
                  onClick={() => setActiveTab(tab.id)}
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
                    {/* Translation Section */}
                    <SettingsSection title="Translations" delay={0}>
                      <TranslationChips
                        options={translations || []}
                        selectedIds={selectedTranslations}
                        onChange={setSelectedTranslations}
                        defaultId="en.arberry"
                        className="translation-chips-scroll"
                      />
                    </SettingsSection>

                    {/* Arabic Font Section */}
                    <SettingsSection title="Arabic Font" delay={0.05}>
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
                    <SettingsSection title="Text Size" delay={0.1}>
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
