"use client";

import { memo, useEffect } from "react";

type KeyboardShortcutsHelpProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

function KeyboardShortcutsHelp({ isOpen = true, onClose }: KeyboardShortcutsHelpProps) {
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { keys: ["↑", "K"], action: "Previous ayah" },
    { keys: ["↓", "J"], action: "Next ayah" },
    { keys: ["P"], action: "Play/Pause audio" },
    { keys: ["W"], action: "Toggle word-by-word" },
    { keys: ["F"], action: "Toggle study mode" },
    { keys: ["/"], action: "Search ayahs" },
    { keys: ["?"], action: "Show shortcuts" },
    { keys: ["Esc"], action: "Close dialogs" }
  ];

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h3>Keyboard Shortcuts</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="shortcuts-list">
          {shortcuts.map(({ keys, action }) => (
            <div key={action} className="shortcut-row">
              <div className="shortcut-keys">
                {keys.map((key, i) => (
                  <span key={i}>
                    <kbd>{key}</kbd>
                    {i < keys.length - 1 && <span className="or">or</span>}
                  </span>
                ))}
              </div>
              <span className="shortcut-action">{action}</span>
            </div>
          ))}
        </div>
        <p className="shortcuts-hint">
          Press <kbd>?</kbd> anytime to show this help
        </p>
      </div>
    </div>
  );
}

export default memo(KeyboardShortcutsHelp);
