import { renderHook, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../lib/constants";
import { useAudioNotes } from "./useAudioNotes";

const AUDIO_NOTE_STORE_NAME = "recitation_notes";
const RECITATION_STORAGE_NOTICE_THRESHOLD_BYTES = 1024 * 1024 * 1024;

type PersistedAudioNoteRecord = {
  id: string;
  title: string;
  durationMs: number;
  mimeType: string;
  size: number;
  createdAt: number;
  updatedAt: number;
  blob: Blob;
};

type FakeRequest<T> = IDBRequest<T> & {
  result: T;
  error: DOMException | null;
  onsuccess: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
};

type FakeOpenRequest = IDBOpenDBRequest & {
  result: IDBDatabase;
  error: DOMException | null;
  onsuccess: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  onupgradeneeded: ((event: Event) => void) | null;
};

let latestProcessor: FakeScriptProcessorNode | null = null;

class FakeTransaction {
  public oncomplete: ((event: Event) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onabort: ((event: Event) => void) | null = null;

  constructor(private store: Map<string, unknown>) {}

  objectStore() {
    const transaction = this;

    return {
      getAll() {
        const request = createRequest<unknown[]>();
        window.setTimeout(() => {
          request.result = Array.from(transaction.store.values());
          request.onsuccess?.(new Event("success"));
          transaction.complete();
        }, 0);
        return request as IDBRequest<unknown[]>;
      },
      put(value: unknown) {
        const request = createRequest<IDBValidKey>();
        window.setTimeout(() => {
          const record = value as { id: string };
          transaction.store.set(record.id, record);
          request.result = record.id;
          request.onsuccess?.(new Event("success"));
          transaction.complete();
        }, 0);
        return request as IDBRequest<IDBValidKey>;
      },
      delete(key: IDBValidKey) {
        const request = createRequest<undefined>();
        window.setTimeout(() => {
          transaction.store.delete(String(key));
          request.result = undefined;
          request.onsuccess?.(new Event("success"));
          transaction.complete();
        }, 0);
        return request as IDBRequest<undefined>;
      }
    } satisfies Partial<IDBObjectStore>;
  }

  complete() {
    window.setTimeout(() => {
      this.oncomplete?.(new Event("complete"));
    }, 0);
  }
}

class FakeDatabase {
  public objectStoreNames = {
    contains: (name: string) => this.stores.has(name)
  } as DOMStringList;

  constructor(private stores: Map<string, Map<string, unknown>>) {}

  createObjectStore(name: string) {
    if (!this.stores.has(name)) {
      this.stores.set(name, new Map());
    }

    return { name } as IDBObjectStore;
  }

  transaction(name: string) {
    if (!this.stores.has(name)) {
      this.stores.set(name, new Map());
    }

    return new FakeTransaction(this.stores.get(name)!) as unknown as IDBTransaction;
  }

  close() {}
}

class FakeMediaStreamSourceNode {
  connect() {}
  disconnect() {}
}

class FakeGainNode {
  public gain = { value: 1 };

  connect() {}
  disconnect() {}
}

class FakeScriptProcessorNode {
  public onaudioprocess: ((event: AudioProcessingEvent) => void) | null = null;

  connect() {}
  disconnect() {}

  emit(samples: number[]) {
    this.onaudioprocess?.({
      inputBuffer: {
        getChannelData: () => new Float32Array(samples)
      }
    } as unknown as AudioProcessingEvent);
  }
}

class FakeAudioContext {
  public state: AudioContextState = "running";
  public sampleRate = 48_000;
  public destination = {} as AudioDestinationNode;

  createMediaStreamSource() {
    return new FakeMediaStreamSourceNode() as unknown as MediaStreamAudioSourceNode;
  }

  createScriptProcessor() {
    latestProcessor = new FakeScriptProcessorNode();
    return latestProcessor as unknown as ScriptProcessorNode;
  }

  createGain() {
    return new FakeGainNode() as unknown as GainNode;
  }

  resume() {
    this.state = "running";
    return Promise.resolve();
  }

  close() {
    this.state = "closed";
    return Promise.resolve();
  }
}

function createRequest<T>() {
  return {
    result: undefined as T,
    error: null,
    onsuccess: null,
    onerror: null
  } as FakeRequest<T>;
}

function createIndexedDbMock(initialRecords: PersistedAudioNoteRecord[] = []) {
  const stores = new Map<string, Map<string, unknown>>();
  if (initialRecords.length > 0) {
    stores.set(
      AUDIO_NOTE_STORE_NAME,
      new Map(initialRecords.map((record) => [record.id, record]))
    );
  }
  const database = new FakeDatabase(stores) as unknown as IDBDatabase;

  return {
    open() {
      const request = {
        result: database,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null
      } as FakeOpenRequest;

      window.setTimeout(() => {
        if (!stores.has(AUDIO_NOTE_STORE_NAME)) {
          request.onupgradeneeded?.(new Event("upgradeneeded"));
        }
        request.onsuccess?.(new Event("success"));
      }, 0);

      return request;
    }
  } as unknown as IDBFactory;
}

describe("useAudioNotes", () => {
  const getUserMedia = vi.fn();
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    latestProcessor = null;
    getUserMedia.mockReset();
    createObjectURL.mockReset();
    revokeObjectURL.mockReset();

    let objectUrlIndex = 0;
    createObjectURL.mockImplementation(() => `blob:audio-${objectUrlIndex += 1}`);

    const stream = {
      getTracks: () => [{ stop: vi.fn() }]
    } as unknown as MediaStream;

    getUserMedia.mockResolvedValue(stream);

    Object.defineProperty(window, "indexedDB", {
      value: createIndexedDbMock(),
      configurable: true,
      writable: true
    });
    Object.defineProperty(globalThis, "indexedDB", {
      value: window.indexedDB,
      configurable: true,
      writable: true
    });
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia },
      configurable: true,
      writable: true
    });
    Object.defineProperty(window, "AudioContext", {
      value: FakeAudioContext,
      configurable: true,
      writable: true
    });
    Object.defineProperty(globalThis, "AudioContext", {
      value: FakeAudioContext,
      configurable: true,
      writable: true
    });
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      configurable: true
    });
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
      writable: true
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectURL,
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("records WAV audio, saves it locally, and deletes it", async () => {
    const { result } = renderHook(() => useAudioNotes());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.isRecordingSupported).toBe(true);
    expect(result.current.isPersistenceSupported).toBe(true);

    await act(async () => {
      await result.current.startRecording();
    });

    expect(getUserMedia).toHaveBeenCalledWith({
      audio: {
        channelCount: { ideal: 1 },
        sampleRate: { ideal: 48000 },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });
    expect(result.current.isRecording).toBe(true);
    expect(latestProcessor).not.toBeNull();

    act(() => {
      latestProcessor?.emit([0, 0.25, -0.25, 0.5, -0.5, 0]);
    });

    act(() => {
      result.current.stopRecording();
    });

    await waitFor(() => expect(result.current.pendingRecording).not.toBeNull());
    expect(result.current.pendingRecording?.mimeType).toBe("audio/wav");
    expect(result.current.pendingRecording?.size).toBeGreaterThan(44);

    await act(async () => {
      await expect(result.current.savePendingRecording("My recitation")).resolves.toBe(true);
    });

    await waitFor(() => expect(result.current.audioNotes).toHaveLength(1));
    expect(result.current.pendingRecording).toBeNull();
    expect(result.current.audioNotes[0]?.title).toBe("My recitation");
    expect(result.current.audioNotes[0]?.mimeType).toBe("audio/wav");
    expect(result.current.totalAudioBytes).toBeGreaterThan(44);

    await act(async () => {
      await result.current.deleteAudioNote(result.current.audioNotes[0]!.id);
    });

    await waitFor(() => expect(result.current.audioNotes).toHaveLength(0));
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it("shows a secure context error before requesting microphone access", async () => {
    Object.defineProperty(window, "isSecureContext", {
      value: false,
      configurable: true
    });

    const { result } = renderHook(() => useAudioNotes());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Microphone recording requires HTTPS or localhost.");
  });

  it("shows a one-time notice when recitation storage crosses 1 GB", async () => {
    Object.defineProperty(window, "indexedDB", {
      value: createIndexedDbMock([
        {
          id: "existing-audio",
          title: "Existing recitation",
          durationMs: 1000,
          mimeType: "audio/wav",
          size: RECITATION_STORAGE_NOTICE_THRESHOLD_BYTES - 16,
          createdAt: 1,
          updatedAt: 1,
          blob: new Blob(["seed"], { type: "audio/wav" })
        }
      ]),
      configurable: true,
      writable: true
    });
    Object.defineProperty(globalThis, "indexedDB", {
      value: window.indexedDB,
      configurable: true,
      writable: true
    });

    const { result } = renderHook(() => useAudioNotes());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.totalAudioBytes).toBe(RECITATION_STORAGE_NOTICE_THRESHOLD_BYTES - 16);
    expect(result.current.showRecitationStorageNotice).toBe(false);

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      latestProcessor?.emit([0.1, -0.1, 0.2, -0.2, 0.15, -0.15]);
      result.current.stopRecording();
    });

    await waitFor(() => expect(result.current.pendingRecording).not.toBeNull());

    await act(async () => {
      await expect(result.current.savePendingRecording("Threshold test")).resolves.toBe(true);
    });

    await waitFor(() => expect(result.current.showRecitationStorageNotice).toBe(true));
    expect(result.current.totalAudioBytes).toBeGreaterThanOrEqual(RECITATION_STORAGE_NOTICE_THRESHOLD_BYTES);

    act(() => {
      result.current.dismissRecitationStorageNotice();
    });

    expect(result.current.showRecitationStorageNotice).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.recitationStorageNoticeDismissed)).toBe("true");
  });
});
