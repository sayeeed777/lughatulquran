"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export type ThemeName = "dark" | "light" | "bw";

type ThemeContextValue = {
    theme: ThemeName;
    isLightTheme: boolean;
    setTheme: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = ThemeContextValue & { children: ReactNode };

export function ThemeProvider({ children, theme, isLightTheme, setTheme }: ThemeProviderProps) {
    return (
        <ThemeContext.Provider value={{ theme, isLightTheme, setTheme }}>
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
