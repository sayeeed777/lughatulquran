"use client";

import { memo } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type Option = { id: string; label: string; short?: string };
export type Reciter = { id: string; label: string; baseUrl?: string };

export type TranslationChipsProps = {
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  defaultId?: string;
  className?: string;
};

export type PremiumSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  icon?: ReactNode;
};

export type ReciterCardProps = {
  reciter: Reciter;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export type SettingsSectionProps = {
  title: string;
  children: ReactNode;
  delay?: number;
};

export const SETTINGS_TABS = [
  { id: "display", label: "Display", icon: "◐" },
  { id: "audio", label: "Audio", icon: "♫" }
] as const;

export const TranslationChips = memo(function TranslationChips({
  options,
  selectedIds,
  onChange,
  defaultId = "en.arberry",
  className = ""
}: TranslationChipsProps) {
  const toggleTranslation = (id: string) => {
    const isSelected = selectedIds.includes(id);

    if (isSelected) {
      if (selectedIds.length === 1) return;
      onChange(selectedIds.filter((translationId) => translationId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className={`translation-chips ${className}`.trim()}>
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id);
        const isDefault = option.id === defaultId;

        return (
          <motion.button
            key={option.id}
            className={`translation-chip ${isSelected ? "selected" : ""} ${isDefault ? "default" : ""}`}
            onClick={() => toggleTranslation(option.id)}
            whileTap={{ scale: 0.97 }}
            initial={false}
            animate={{
              backgroundColor: isSelected
                ? "rgba(111, 212, 177, 0.18)"
                : "rgba(255, 255, 255, 0.04)"
            }}
            transition={{ duration: 0.2 }}
          >
            <span className="chip-label">{option.label}</span>
            <AnimatePresence>
              {isSelected && (
                <motion.span
                  className="chip-check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              )}
            </AnimatePresence>
            {isDefault && <span className="default-badge">Default</span>}
          </motion.button>
        );
      })}
      <p className="chips-hint">Select one or more translations</p>
    </div>
  );
});

export const PremiumSlider = memo(function PremiumSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  icon
}: PremiumSliderProps) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className="premium-slider">
      <div className="slider-header">
        <span className="slider-icon">{icon}</span>
        <span className="slider-label">{label}</span>
        <span className="slider-value">{Math.round(value * 100)}%</span>
      </div>
      <div className="slider-track-container">
        <progress className="slider-track-fill" max={100} value={percentage} aria-hidden="true" />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="slider-input"
        />
      </div>
    </div>
  );
});

export const ReciterCard = memo(function ReciterCard({ reciter, isSelected, onSelect }: ReciterCardProps) {
  return (
    <motion.button
      className={`reciter-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(reciter.id)}
      whileTap={{ scale: 0.98 }}
      initial={false}
      animate={{
        backgroundColor: isSelected
          ? "rgba(111, 212, 177, 0.15)"
          : "rgba(255, 255, 255, 0.04)"
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="reciter-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
      </div>
      <span className="reciter-name">{reciter.label}</span>
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="check-icon"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

export const SettingsSection = memo(function SettingsSection({ title, children, delay = 0 }: SettingsSectionProps) {
  return (
    <motion.div
      className="settings-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <h4 className="section-title">{title}</h4>
      <div className="section-content">{children}</div>
    </motion.div>
  );
});
