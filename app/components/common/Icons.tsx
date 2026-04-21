"use client";

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const defaults: IconProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

export function SearchIcon({ size = 20, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
        </svg>
    );
}

export function SettingsIcon({ size = 20, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 2.09V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09A1.65 1.65 0 0 0 21.91 11H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
    );
}

export function ClockIcon({ size = 20, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </svg>
    );
}

export function CloseIcon({ size = 18, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}

export function CopyIcon({ size = 16, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    );
}

export function CheckIcon({ size = 16, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}

export function PaletteIcon({ size = 20, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
            <path d="M12 2a10 10 0 0 0 0 20c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01A1.49 1.49 0 0 1 14.5 18h1A5.5 5.5 0 0 0 21 12.5C21 6.8 17.02 2 12 2Z" />
            <circle cx="8" cy="10" r="1.25" fill="currentColor" stroke="none" />
            <circle cx="12" cy="6.5" r="1.25" fill="currentColor" stroke="none" />
            <circle cx="16" cy="10" r="1.25" fill="currentColor" stroke="none" />
            <circle cx="9" cy="14.5" r="1.25" fill="currentColor" stroke="none" />
        </svg>
    );
}
