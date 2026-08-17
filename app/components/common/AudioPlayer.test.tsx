import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AudioPlayer from "./AudioPlayer";

const AYAH_AUDIO_URL = "https://everyayah.com/data/Husary_64kbps/001001.mp3";
const CHAPTER_AUDIO_URL = "https://audio.qurancdn.com/chapter-1.mp3";

const baseProps = {
  reciterId: "husary",
  reciterLabel: "Mahmoud Khalil Al-Husary",
  nowPlayingLabel: "Al-Fatiha - Ayah 1",
  audioSrc: AYAH_AUDIO_URL,
  isAutoPlaying: true,
  isAudioPaused: false,
  onPlaySurah: vi.fn(),
  onStopAutoPlay: vi.fn(),
  onAudioEnded: vi.fn(),
  selectedSurah: { number: 1, numberOfAyahs: 7 },
  nowPlaying: { surah: 1, ayah: 1 },
  showPlayerBar: false
};

describe("AudioPlayer Reader repeat", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        audioUrl: CHAPTER_AUDIO_URL,
        timings: [{ ayah: 1, fromMs: 0, toMs: 4000, words: [] }]
      })
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("switches from the chapter stream to the ayah file when repeat starts", async () => {
    const { container, rerender } = render(<AudioPlayer {...baseProps} />);
    const audio = container.querySelector("audio");
    expect(audio).not.toBeNull();

    await waitFor(() => {
      expect(audio?.src).toBe(CHAPTER_AUDIO_URL);
    });

    rerender(
      <AudioPlayer
        {...baseProps}
        memorizeActive
        memorizeStartAyah={1}
        memorizeEndAyah={1}
        memorizeLoops={3}
        memorizeRemaining={3}
      />
    );

    await waitFor(() => {
      expect(audio?.src).toBe(AYAH_AUDIO_URL);
    });
  });
});
