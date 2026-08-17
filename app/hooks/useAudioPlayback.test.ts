import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { MemorizeConfig } from "../lib/types";
import { useAudioPlayback } from "./useAudioPlayback";

const INITIAL_MEMORIZE_CONFIG: MemorizeConfig = {
  active: false,
  startAyah: 1,
  endAyah: 1,
  loops: 0,
  remaining: 0
};

const useRepeatHarness = () => {
  const [memorizeConfig, setMemorizeConfig] = useState(INITIAL_MEMORIZE_CONFIG);
  const playback = useAudioPlayback({
    selectedSurah: { number: 1, numberOfAyahs: 7 },
    memorizeConfig,
    setMemorizeConfig,
    setFocusedAyahKey: vi.fn(),
    setPendingScroll: vi.fn()
  });

  return { memorizeConfig, playback };
};

describe("useAudioPlayback Reader repeat", () => {
  it("plays the current ayah and two additional repeats in 2x mode", () => {
    const { result } = renderHook(useRepeatHarness);

    act(() => {
      result.current.playback.handleSetReaderRepeat(1, 2, 2);
    });

    expect(result.current.memorizeConfig).toMatchObject({
      active: true,
      startAyah: 2,
      endAyah: 2,
      loops: 3,
      remaining: 3
    });
    expect(result.current.playback.nowPlaying).toEqual({ surah: 1, ayah: 2 });

    act(() => result.current.playback.handleAudioEnded());
    expect(result.current.memorizeConfig.remaining).toBe(2);
    expect(result.current.playback.nowPlaying).toEqual({ surah: 1, ayah: 2 });

    act(() => result.current.playback.handleAudioEnded());
    expect(result.current.memorizeConfig.remaining).toBe(1);
    expect(result.current.playback.nowPlaying).toEqual({ surah: 1, ayah: 2 });

    act(() => result.current.playback.handleAudioEnded());
    expect(result.current.memorizeConfig).toMatchObject({ active: false, remaining: 0 });
    expect(result.current.playback.nowPlaying).toBeNull();
    expect(result.current.playback.readerRepeat).toBeNull();
  });
});
