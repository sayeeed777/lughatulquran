"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type ProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
};

type FloatingButtonProps = {
  icon?: ReactNode;
  label?: string;
  onClick: () => void;
  active?: boolean;
  variant?: string;
};

/**
 * Progress Ring Component
 * Circular progress indicator for study mode
 */
export const ProgressRing = ({ progress, size = 40, strokeWidth = 3 }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        className="progress-ring-bg"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="progress-ring-fill"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={center}
        cy={center}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </svg>
  );
};

/**
 * Floating Action Button
 * Animated button for study mode actions
 */
export const FloatingButton = ({
  icon,
  label,
  onClick,
  active,
  variant = "default"
}: FloatingButtonProps) => (
  <motion.button
    className={`study-fab ${variant} ${active ? "active" : ""}`}
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    title={label}
  >
    {icon}
  </motion.button>
);

/**
 * Quick Panel Component
 * Docked/overlay panel for study mode settings
 */
export const QuickPanel = ({
  isOpen,
  onClose,
  title,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) => (
  <>
    <motion.div
      className={`quick-panel-backdrop${isOpen ? " is-open" : ""}`}
      initial={false}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={onClose}
    />
    <motion.aside
      className={`quick-panel${isOpen ? " is-open" : ""}`}
      initial={false}
      animate={{ x: isOpen ? 0 : "100%", opacity: isOpen ? 1 : 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden={!isOpen}
    >
      <div className="quick-panel-header">
        <span className="quick-panel-title">{title}</span>
        <button className="quick-panel-close" onClick={onClose} type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="quick-panel-content">{children}</div>
    </motion.aside>
  </>
);

/**
 * Stats Card Component
 * Display stat with icon and value
 */
export const StatCard = ({
  label,
  value,
  icon,
  tone = "accent"
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: "accent" | "accent-2" | "amber" | "violet";
}) => {
  return (
    <div className={`study-stat-card stat-tone-${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
};
