"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEYS } from "../lib/constants";
import type { AudioNote, AudioNoteMeta } from "../lib/types";
import { useLocalStorage } from "./common";

const AUDIO_NOTES_DB_NAME = "openfurqan_audio_notes";
const AUDIO_NOTES_STORE_NAME = "recitation_notes";
const AUDIO_NOTE_DB_VERSION = 1;
const AUDIO_BUFFER_SIZE = 4096;
const RECORDING_TICK_MS = 250;
const RECITATION_STORAGE_NOTICE_THRESHOLD_BYTES = 1024 * 1024 * 1024;

type WindowWithWebkitAudioContext = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type PersistedAudioNote = AudioNoteMeta & {
  blob: Blob;
};

type PendingAudioNote = {
  blob: Blob;
  audioUrl: string;
  durationMs: number;
  mimeType: string;
  size: number;
};

type UseAudioNotesResult = {
  audioNotes: AudioNote[];
  pendingRecording: PendingAudioNote | null;
  isLoaded: boolean;
  isPreparingRecording: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isRecording: boolean;
  isRecordingSupported: boolean;
  isPersistenceSupported: boolean;
  recordingDurationMs: number;
  totalAudioBytes: number;
  showRecitationStorageNotice: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  discardPendingRecording: () => void;
  savePendingRecording: (title: string) => Promise<boolean>;
  deleteAudioNote: (id: string) => Promise<void>;
  dismissRecitationStorageNotice: () => void;
};

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted."));
  });
}

function openAudioNotesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(AUDIO_NOTES_DB_NAME, AUDIO_NOTE_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(AUDIO_NOTES_STORE_NAME)) {
        database.createObjectStore(AUDIO_NOTES_STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to open the audio notes database."));
  });
}

async function listPersistedAudioNotes(): Promise<PersistedAudioNote[]> {
  const database = await openAudioNotesDb();

  try {
    const transaction = database.transaction(AUDIO_NOTES_STORE_NAME, "readonly");
    const records = await requestToPromise(
      transaction.objectStore(AUDIO_NOTES_STORE_NAME).getAll() as IDBRequest<PersistedAudioNote[]>
    );
    await transactionToPromise(transaction);
    return [...records].sort((left, right) => right.updatedAt - left.updatedAt);
  } finally {
    database.close();
  }
}

async function putPersistedAudioNote(record: PersistedAudioNote): Promise<void> {
  const database = await openAudioNotesDb();

  try {
    const transaction = database.transaction(AUDIO_NOTES_STORE_NAME, "readwrite");
    transaction.objectStore(AUDIO_NOTES_STORE_NAME).put(record);
    await transactionToPromise(transaction);
  } finally {
    database.close();
  }
}

async function deletePersistedAudioNote(id: string): Promise<void> {
  const database = await openAudioNotesDb();

  try {
    const transaction = database.transaction(AUDIO_NOTES_STORE_NAME, "readwrite");
    transaction.objectStore(AUDIO_NOTES_STORE_NAME).delete(id);
    await transactionToPromise(transaction);
  } finally {
    database.close();
  }
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const nextWindow = window as WindowWithWebkitAudioContext;
  return nextWindow.AudioContext || nextWindow.webkitAudioContext || null;
}

function concatPcmChunks(chunks: Float32Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });

  return merged;
}

function writeAsciiString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function encodeWavBlob(samples: Float32Array, sampleRate: number) {
  const wavBuffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(wavBuffer);

  writeAsciiString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeAsciiString(view, 8, "WAVE");
  writeAsciiString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAsciiString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let pcmOffset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index] || 0));
    view.setInt16(pcmOffset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    pcmOffset += 2;
  }

  return new Blob([wavBuffer], { type: "audio/wav" });
}

function deriveAudioNoteTitle(title: string, timestamp: number) {
  const trimmedTitle = title.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  return `Recitation ${new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })}`;
}

function createAudioNoteId(timestamp: number) {
  return `anote-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
}

function getRecordingErrorMessage(error: unknown) {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Microphone recording requires HTTPS or localhost.";
  }

  const errorName = error instanceof DOMException ? error.name : "";
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : "";

  if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
    if (errorMessage.includes("policy")) {
      return "Microphone access is blocked by this site's browser permissions policy.";
    }
    return "Microphone access was denied. Please allow it in your browser settings and try again.";
  }

  if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
    return "No microphone was found on this device.";
  }

  if (errorName === "NotReadableError" || errorName === "TrackStartError") {
    return "The microphone is busy or unavailable right now. Close other recording apps and try again.";
  }

  if (errorName === "SecurityError") {
    return "Microphone recording requires HTTPS or localhost.";
  }

  if (errorMessage.includes("scriptprocessor")) {
    return "This browser does not support in-app audio recording.";
  }

  return "Microphone access was blocked or is unavailable.";
}

export function useAudioNotes(): UseAudioNotesResult {
  const [audioNotes, setAudioNotes] = useState<AudioNote[]>([]);
  const [pendingRecording, setPendingRecording] = useState<PendingAudioNote | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingSupported, setIsRecordingSupported] = useState(false);
  const [isPersistenceSupported, setIsPersistenceSupported] = useState(false);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);
  const [totalAudioBytes, setTotalAudioBytes] = useState(0);
  const [showRecitationStorageNotice, setShowRecitationStorageNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recitationStorageNoticeDismissed, setRecitationStorageNoticeDismissed, isStorageNoticeLoaded] =
    useLocalStorage<boolean>(STORAGE_KEYS.recitationStorageNoticeDismissed, false);

  const isMountedRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const muteGainRef = useRef<GainNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(0);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const isCapturingRef = useRef(false);

  const stopMediaTracks = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const disconnectAudioGraph = useCallback(() => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    mediaSourceRef.current?.disconnect();
    mediaSourceRef.current = null;

    muteGainRef.current?.disconnect();
    muteGainRef.current = null;
  }, []);

  const closeAudioContext = useCallback(async () => {
    const currentAudioContext = audioContextRef.current;
    audioContextRef.current = null;

    if (!currentAudioContext || currentAudioContext.state === "closed") {
      return;
    }

    try {
      await currentAudioContext.close();
    } catch {
      // Ignore teardown failures during shutdown.
    }
  }, []);

  const resetCaptureBuffers = useCallback(() => {
    pcmChunksRef.current = [];
    sampleRateRef.current = 0;
    recordingStartedAtRef.current = null;
    isCapturingRef.current = false;
  }, []);

  const teardownCapture = useCallback(async () => {
    clearRecordingTimer();
    isCapturingRef.current = false;
    disconnectAudioGraph();
    stopMediaTracks();
    await closeAudioContext();
  }, [clearRecordingTimer, closeAudioContext, disconnectAudioGraph, stopMediaTracks]);

  const replaceAudioNotes = useCallback((records: PersistedAudioNote[]) => {
    setTotalAudioBytes(records.reduce((total, record) => total + Math.max(0, record.size || 0), 0));
    setAudioNotes(
      records.map(({ blob, ...record }) => ({
        ...record,
        audioUrl: URL.createObjectURL(blob)
      }))
    );
  }, []);

  const refreshAudioNotes = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    if (!(typeof window !== "undefined" && "indexedDB" in window)) {
      setAudioNotes([]);
      setTotalAudioBytes(0);
      setIsLoaded(true);
      return;
    }

    try {
      const records = await listPersistedAudioNotes();
      if (!isMountedRef.current) {
        return;
      }
      replaceAudioNotes(records);
      setError(null);
    } catch {
      if (isMountedRef.current) {
        setError("Could not load saved recitation notes on this device.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoaded(true);
      }
    }
  }, [replaceAudioNotes]);

  const discardPendingRecording = useCallback(() => {
    setPendingRecording(null);
    setRecordingDurationMs(0);
    setError(null);
  }, []);

  const dismissRecitationStorageNotice = useCallback(() => {
    setShowRecitationStorageNotice(false);
    setRecitationStorageNoticeDismissed(true);
  }, [setRecitationStorageNoticeDismissed]);

  useEffect(() => {
    isMountedRef.current = true;
    setIsRecordingSupported(
      typeof window !== "undefined"
      && Boolean(getAudioContextConstructor())
      && Boolean(window.navigator?.mediaDevices?.getUserMedia)
    );
    setIsPersistenceSupported(typeof window !== "undefined" && "indexedDB" in window);

    void refreshAudioNotes();

    return () => {
      isMountedRef.current = false;
      void teardownCapture();
      resetCaptureBuffers();
    };
  }, [refreshAudioNotes, resetCaptureBuffers, teardownCapture]);

  useEffect(() => {
    return () => {
      audioNotes.forEach((note) => URL.revokeObjectURL(note.audioUrl));
    };
  }, [audioNotes]);

  useEffect(() => {
    return () => {
      if (pendingRecording) {
        URL.revokeObjectURL(pendingRecording.audioUrl);
      }
    };
  }, [pendingRecording]);

  useEffect(() => {
    if (!isLoaded || !isStorageNoticeLoaded) {
      return;
    }

    if (totalAudioBytes < RECITATION_STORAGE_NOTICE_THRESHOLD_BYTES) {
      setShowRecitationStorageNotice(false);
      if (recitationStorageNoticeDismissed) {
        setRecitationStorageNoticeDismissed(false);
      }
      return;
    }

    if (!recitationStorageNoticeDismissed) {
      setShowRecitationStorageNotice(true);
    }
  }, [
    isLoaded,
    isStorageNoticeLoaded,
    recitationStorageNoticeDismissed,
    setRecitationStorageNoticeDismissed,
    totalAudioBytes
  ]);

  const startRecording = useCallback(async () => {
    if (isRecording || isPreparingRecording) {
      return;
    }

    if (!isPersistenceSupported) {
      setError("This browser cannot save recorded audio locally.");
      return;
    }

    if (!isRecordingSupported) {
      setError("This browser does not support in-app audio recording.");
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Microphone recording requires HTTPS or localhost.");
      return;
    }

    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) {
      setError("This browser does not support in-app audio recording.");
      return;
    }

    setError(null);
    setIsPreparingRecording(true);
    setPendingRecording(null);
    setRecordingDurationMs(0);

    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 48000 },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const audioContext = new AudioContextConstructor();
      if (typeof audioContext.createScriptProcessor !== "function") {
        throw new Error("ScriptProcessorUnavailable");
      }

      const mediaSource = audioContext.createMediaStreamSource(stream);
      const scriptProcessor = audioContext.createScriptProcessor(AUDIO_BUFFER_SIZE, 1, 1);
      const muteGain = audioContext.createGain();
      muteGain.gain.value = 0;

      pcmChunksRef.current = [];
      sampleRateRef.current = audioContext.sampleRate;
      mediaStreamRef.current = stream;
      audioContextRef.current = audioContext;
      mediaSourceRef.current = mediaSource;
      scriptProcessorRef.current = scriptProcessor;
      muteGainRef.current = muteGain;
      recordingStartedAtRef.current = Date.now();

      scriptProcessor.onaudioprocess = (event) => {
        if (!isCapturingRef.current) {
          return;
        }

        const channelData = event.inputBuffer.getChannelData(0);
        pcmChunksRef.current.push(new Float32Array(channelData));
      };

      mediaSource.connect(scriptProcessor);
      scriptProcessor.connect(muteGain);
      muteGain.connect(audioContext.destination);

      await audioContext.resume();

      if (!isMountedRef.current) {
        await teardownCapture();
        resetCaptureBuffers();
        return;
      }

      isCapturingRef.current = true;
      setIsPreparingRecording(false);
      setIsRecording(true);

      recordingTimerRef.current = window.setInterval(() => {
        if (!recordingStartedAtRef.current || !isMountedRef.current) {
          return;
        }
        setRecordingDurationMs(Date.now() - recordingStartedAtRef.current);
      }, RECORDING_TICK_MS);
    } catch (error) {
      await teardownCapture();
      resetCaptureBuffers();
      if (isMountedRef.current) {
        setIsPreparingRecording(false);
        setIsRecording(false);
        setError(getRecordingErrorMessage(error));
      }
    }
  }, [
    isPreparingRecording,
    isPersistenceSupported,
    isRecording,
    isRecordingSupported,
    resetCaptureBuffers,
    teardownCapture
  ]);

  const stopRecording = useCallback(() => {
    if (!isRecording) {
      return;
    }

    const pcmChunks = [...pcmChunksRef.current];
    const sampleRate = sampleRateRef.current;

    void (async () => {
      await teardownCapture();
      resetCaptureBuffers();

      if (!isMountedRef.current) {
        return;
      }

      const mergedSamples = concatPcmChunks(pcmChunks);
      const durationMs = sampleRate > 0 ? Math.round((mergedSamples.length / sampleRate) * 1000) : 0;

      setIsPreparingRecording(false);
      setIsRecording(false);
      setRecordingDurationMs(durationMs);

      if (!mergedSamples.length || sampleRate <= 0) {
        setPendingRecording(null);
        setError("No audio was captured. Please try recording again.");
        return;
      }

      const nextBlob = encodeWavBlob(mergedSamples, sampleRate);
      setPendingRecording({
        blob: nextBlob,
        audioUrl: URL.createObjectURL(nextBlob),
        durationMs,
        mimeType: nextBlob.type || "audio/wav",
        size: nextBlob.size
      });
      setError(null);
    })();
  }, [isRecording, resetCaptureBuffers, teardownCapture]);

  const savePendingRecording = useCallback(
    async (title: string) => {
      if (!pendingRecording) {
        return false;
      }

      if (!isPersistenceSupported) {
        setError("This browser cannot save recorded audio locally.");
        return false;
      }

      const now = Date.now();
      const nextRecord: PersistedAudioNote = {
        id: createAudioNoteId(now),
        title: deriveAudioNoteTitle(title, now),
        durationMs: pendingRecording.durationMs,
        mimeType: pendingRecording.mimeType,
        size: pendingRecording.size,
        createdAt: now,
        updatedAt: now,
        blob: pendingRecording.blob
      };

      setIsSaving(true);

      try {
        await putPersistedAudioNote(nextRecord);
        if (!isMountedRef.current) {
          return false;
        }
        setPendingRecording(null);
        setRecordingDurationMs(0);
        await refreshAudioNotes();
        setError(null);
        return true;
      } catch {
        if (isMountedRef.current) {
          setError("Could not save this recitation note locally.");
        }
        return false;
      } finally {
        if (isMountedRef.current) {
          setIsSaving(false);
        }
      }
    },
    [isPersistenceSupported, pendingRecording, refreshAudioNotes]
  );

  const deleteAudioNote = useCallback(async (id: string) => {
    if (!isPersistenceSupported) {
      setError("This browser cannot manage recorded audio locally.");
      return;
    }

    setIsDeleting(true);

    try {
      await deletePersistedAudioNote(id);
      if (isMountedRef.current) {
        await refreshAudioNotes();
        setError(null);
      }
    } catch {
      if (isMountedRef.current) {
        setError("Could not remove this recitation note.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(false);
      }
    }
  }, [isPersistenceSupported, refreshAudioNotes]);

  return {
    audioNotes,
    pendingRecording,
    isLoaded,
    isPreparingRecording,
    isSaving,
    isDeleting,
    isRecording,
    isRecordingSupported,
    isPersistenceSupported,
    recordingDurationMs,
    totalAudioBytes,
    showRecitationStorageNotice,
    error,
    startRecording,
    stopRecording,
    discardPendingRecording,
    savePendingRecording,
    deleteAudioNote,
    dismissRecitationStorageNotice
  };
}
