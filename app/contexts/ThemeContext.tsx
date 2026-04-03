"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

export type ThemeName = "dark" | "light" | "bw" | "bw-dark" | "mist" | "sky";

type ThemeContextValue = {
    theme: ThemeName;
    isLightTheme: boolean;
    setTheme: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = ThemeContextValue & { children: ReactNode };

export function ThemeProvider({ children, theme, isLightTheme, setTheme }: ThemeProviderProps) {
    const value = useMemo(() => ({ theme, isLightTheme, setTheme }), [theme, isLightTheme, setTheme]);
    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within a <ThemeProvider>");
    }
    return ctx;
}
