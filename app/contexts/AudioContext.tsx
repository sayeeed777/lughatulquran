"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { NowPlaying, Reciter, SetState } from "../lib/types";

type AudioContextValue = {
    // State
    nowPlaying: NowPlaying | null;
    isAutoPlaying: boolean;
    isAudioPaused: boolean;
    audioSrc: string | null;
    nextAudioSrc: string | null;
    reciterLabel: string;
    nowPlayingLabel: string;
    // Settings
    reciterId: string;
    setReciterId: SetState<string>;
    selectedReciter: Reciter;
    playbackRate: number;
    setPlaybackRate: SetState<number>;
    // Actions
    handlePlaySurah: (startAyah: number) => void;
    handleStopAutoPlay: () => void;
    handleAudioEnded: () => void;
    handlePlayAyah: (surah: number, ayah: number) => void;
    handleToggleAyah: (surah: number, ayah: number) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

type AudioProviderProps = AudioContextValue & { children: ReactNode };

export function AudioProvider({ children, ...value }: AudioProviderProps) {
    return (
        <AudioContext.Provider value={value}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio(): AudioContextValue {
    const ctx = useContext(AudioContext);
    if (!ctx) {
        throw new Error("useAudio must be used within an <AudioProvider>");
    }
    return ctx;
}

export type { AudioContextValue };
