"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Apple-style Segmented Control (for single select)
const SegmentedControl = memo(function SegmentedControl({ options, value, onChange, size = "normal" }) {
    const selectedIndex = options.findIndex(opt => opt.id === value);

    return (
        <div className={`segmented-control ${size}`}>
            <motion.div
                className="segmented-indicator"
                layoutId="segmented-indicator"
                initial={false}
                animate={{
                    x: `${selectedIndex * 100}%`,
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35
                }}
                style={{ width: `${100 / options.length}%` }}
            />
            {options.map((option) => (
                <button
                    key={option.id}
                    className={`segmented-btn ${value === option.id ? "active" : ""}`}
                    onClick={() => onChange(option.id)}
                    aria-pressed={value === option.id}
                >
                    {option.short || option.label}
                </button>
            ))}
        </div>
    );
});

// Multi-Select Translation Chips
const TranslationChips = memo(function TranslationChips({ options, selectedIds, onChange, defaultId = "en.arberry" }) {
    const toggleTranslation = (id) => {
        const isSelected = selectedIds.includes(id);
        const isDefault = id === defaultId;

        if (isSelected) {
            // Don't allow deselecting if it's the only one selected
            if (selectedIds.length === 1) return;
            // Remove from selection
            onChange(selectedIds.filter(t => t !== id));
        } else {
            // Add to selection
            onChange([...selectedIds, id]);
        }
    };

    return (
        <div className="translation-chips">
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

// Apple-style Slider with gradient track
const PremiumSlider = memo(function PremiumSlider({ label, value, min, max, step, onChange, icon }) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="premium-slider">
            <div className="slider-header">
                <span className="slider-icon">{icon}</span>
                <span className="slider-label">{label}</span>
                <span className="slider-value">{Math.round(value * 100)}%</span>
            </div>
            <div className="slider-track-container">
                <div
                    className="slider-track-fill"
                    style={{ width: `${percentage}%` }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="slider-input"
                />
            </div>
        </div>
    );
});

// Apple-style Option Card for Reciter
const ReciterCard = memo(function ReciterCard({ reciter, isSelected, onSelect }) {
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

// Settings Section with iOS-style header
const SettingsSection = memo(function SettingsSection({ title, children, delay = 0 }) {
    return (
        <motion.div
            className="settings-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <h4 className="section-title">{title}</h4>
            <div className="section-content">
                {children}
            </div>
        </motion.div>
    );
});

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
    // Utility
    clamp
}) {
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
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const handleArabicScale = useCallback((val) => {
        setFontScale(prev => ({ ...prev, arabic: clamp(val, 0.8, 1.4) }));
    }, [setFontScale, clamp]);

    const handleTranslationScale = useCallback((val) => {
        setFontScale(prev => ({ ...prev, translation: clamp(val, 0.9, 1.4) }));
    }, [setFontScale, clamp]);

    const tabs = [
        { id: "display", label: "Display", icon: "◐" },
        { id: "audio", label: "Audio", icon: "♫" }
    ];

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

    // Swipe gesture handling for tabs
    const handleSwipe = useCallback((direction) => {
        const currentIndex = tabs.findIndex(t => t.id === activeTab);
        if (direction === "left" && currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1].id);
        } else if (direction === "right" && currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1].id);
        }
    }, [activeTab, tabs]);

    // Handle drag end for swipe-to-dismiss
    const handleDragEnd = useCallback((event, info) => {
        const threshold = 100;
        const velocity = 500;

        // Swipe down to dismiss (only on mobile)
        if (info.offset.y > threshold || info.velocity.y > velocity) {
            onClose();
        }
    }, [onClose]);

    // Handle horizontal swipe in content area
    const handleContentDragEnd = useCallback((event, info) => {
        const threshold = 50;
        const velocity = 300;

        if (info.offset.x < -threshold || info.velocity.x < -velocity) {
            handleSwipe("left");
        } else if (info.offset.x > threshold || info.velocity.x > velocity) {
            handleSwipe("right");
        }
    }, [handleSwipe]);

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
                        drag={isMobile ? "y" : false}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={handleDragEnd}
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
                            {tabs.map((tab) => (
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

                        {/* Content - with swipe gestures on mobile */}
                        <motion.div
                            className="settings-content"
                            drag={isMobile ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={handleContentDragEnd}
                        >
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
                                            />
                                        </SettingsSection>

                                        {/* Text Size Section */}
                                        <SettingsSection title="Text Size" delay={0.05}>
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
