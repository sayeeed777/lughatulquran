"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

type ThemeContextValue = {
    theme: "dark" | "light";
    isLightTheme: boolean;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = ThemeContextValue & { children: ReactNode };

export function ThemeProvider({ children, theme, isLightTheme, toggleTheme }: ThemeProviderProps) {
    return (
        <ThemeContext.Provider value={{ theme, isLightTheme, toggleTheme }}>
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
