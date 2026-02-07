"use client";

import { motion, AnimatePresence } from "framer-motion";

/**
 * Progress Ring Component
 * Circular progress indicator for study mode
 */
export const ProgressRing = ({ progress, size = 40, strokeWidth = 3 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

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
                cx={size / 2}
                cy={size / 2}
                style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: offset,
                    transform: "rotate(-90deg)",
                    transformOrigin: "50% 50%",
                }}
            />
        </svg>
    );
};

/**
 * Floating Action Button
 * Animated button for study mode actions
 */
export const FloatingButton = ({ icon, label, onClick, active, variant = "default" }) => (
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
/** @param {{ isOpen: boolean, onClose: () => void, title: string, children: import("react").ReactNode }} props */
export const QuickPanel = ({ isOpen, onClose, title, children }) => (
    <AnimatePresence>
        {isOpen && (
            <>
                <motion.div
                    className="quick-panel-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />
                <motion.aside
                    className="quick-panel"
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                >
                    <div className="quick-panel-header">
                        <span className="quick-panel-title">{title}</span>
                        <button className="quick-panel-close" onClick={onClose}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="quick-panel-content">
                        {children}
                    </div>
                </motion.aside>
            </>
        )}
    </AnimatePresence>
);

/**
 * Stats Card Component
 * Display stat with icon and value
 */
/** @param {{ label: string, value: string | number, icon?: import("react").ReactNode, color?: string }} props */
export const StatCard = ({ label, value, icon, color }) => {
    /** @type {import("react").CSSProperties & Record<string, string | number>} */
    const style = { "--stat-color": color };
    return (
        <div className="study-stat-card" style={style}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-info">
                <span className="stat-value">{value}</span>
                <span className="stat-label">{label}</span>
            </div>
        </div>
    );
};
