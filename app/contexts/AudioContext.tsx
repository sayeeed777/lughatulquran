"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { NowPlaying, ReaderRepeatMode, ReaderRepeatState, Reciter, SetState } from "../lib/types";

type AudioContextValue = {
    // State
    nowPlaying: NowPlaying | null;
    isAutoPlaying: boolean;
    isAudioPaused: boolean;
    activeWordPosition: number | null;
    readerRepeat: ReaderRepeatState | null;
    audioSrc: string | null;
    nextAudioSrc: string | null;
    reciterLabel: string;
    reciterBaseUrl: string;
    nowPlayingLabel: string;
    nowPlayingPage: number | null;
    surahPageStart: number | null;
    surahPageEnd: number | null;
    // Settings
    reciterId: string;
    setReciterId: SetState<string>;
    selectedReciter: Reciter;
    playbackRate: number;
    setPlaybackRate: SetState<number>;
    setActiveWordPosition: SetState<number | null>;
    // Actions
    handlePlaySurah: (startAyah: number) => void;
    handleStopAutoPlay: () => void;
    handleAudioEnded: () => void;
    handlePlayAyah: (surah: number, ayah: number) => void;
    handleToggleAyah: (surah: number, ayah: number) => void;
    handleCycleReaderRepeat: (surah: number, ayah: number) => void;
    handleSetReaderRepeat: (surah: number, ayah: number, mode: ReaderRepeatMode | null) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

type AudioProviderProps = AudioContextValue & { children: ReactNode };

export function AudioProvider({ children, ...props }: AudioProviderProps) {
    const value = useMemo(() => ({
        nowPlaying: props.nowPlaying,
        isAutoPlaying: props.isAutoPlaying,
        isAudioPaused: props.isAudioPaused,
        activeWordPosition: props.activeWordPosition,
        readerRepeat: props.readerRepeat,
        audioSrc: props.audioSrc,
        nextAudioSrc: props.nextAudioSrc,
        reciterLabel: props.reciterLabel,
        reciterBaseUrl: props.reciterBaseUrl,
        nowPlayingLabel: props.nowPlayingLabel,
        nowPlayingPage: props.nowPlayingPage,
        surahPageStart: props.surahPageStart,
        surahPageEnd: props.surahPageEnd,
        reciterId: props.reciterId,
        setReciterId: props.setReciterId,
        selectedReciter: props.selectedReciter,
        playbackRate: props.playbackRate,
        setPlaybackRate: props.setPlaybackRate,
        setActiveWordPosition: props.setActiveWordPosition,
        handlePlaySurah: props.handlePlaySurah,
        handleStopAutoPlay: props.handleStopAutoPlay,
        handleAudioEnded: props.handleAudioEnded,
        handlePlayAyah: props.handlePlayAyah,
        handleToggleAyah: props.handleToggleAyah,
        handleCycleReaderRepeat: props.handleCycleReaderRepeat,
        handleSetReaderRepeat: props.handleSetReaderRepeat,
    }), [
        props.nowPlaying, props.isAutoPlaying, props.isAudioPaused, props.activeWordPosition,
        props.readerRepeat, props.audioSrc, props.nextAudioSrc, props.reciterLabel,
        props.reciterBaseUrl, props.nowPlayingLabel, props.nowPlayingPage,
        props.surahPageStart, props.surahPageEnd, props.reciterId,
        props.setReciterId, props.selectedReciter, props.playbackRate,
        props.setPlaybackRate, props.setActiveWordPosition, props.handlePlaySurah, props.handleStopAutoPlay,
        props.handleAudioEnded, props.handlePlayAyah, props.handleToggleAyah,
        props.handleCycleReaderRepeat, props.handleSetReaderRepeat,
    ]);
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
