"use client";

import { useCallback, useEffect, useState } from "react";

export type VideoQuality = "low" | "balanced" | "high";
export type BackgroundEffect =
  | "none"
  | "blur-light"
  | "blur-medium"
  | "blur-strong"
  | "graphite"
  | "dusk"
  | "teal";

export const QUALITY_PRESETS: Record<
  VideoQuality,
  { label: string; width: number; height: number }
> = {
  low: { label: "Low — 360p", width: 640, height: 360 },
  balanced: { label: "Balanced — 540p", width: 960, height: 540 },
  high: { label: "High — 720p", width: 1280, height: 720 },
};

export const BACKDROP_COLORS: Record<string, [string, string]> = {
  graphite: ["#2B3140", "#161A23"],
  dusk: ["#3B2F5C", "#1B1430"],
  teal: ["#0E4C57", "#062A31"],
};

export interface MediaPreferences {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  cameraId: string;
  microphoneId: string;
  speakerId: string;
  quality: VideoQuality;
  effect: BackgroundEffect;
}

const STORAGE_KEY = "meeting_media_preferences";

const DEFAULTS: MediaPreferences = {
  cameraEnabled: false,
  microphoneEnabled: false,
  cameraId: "",
  microphoneId: "",
  speakerId: "",
  quality: "balanced",
  effect: "none",
};

function readStored(): MediaPreferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return DEFAULTS;
  }
}

/** Persisted device choices, so the pre-join screen remembers the last setup. */
export function useMediaPreferences() {
  const [preferences, setPreferences] = useState<MediaPreferences>(DEFAULTS);

  // Read on mount rather than during render, so SSR and the client agree.
  useEffect(() => setPreferences(readStored()), []);

  const update = useCallback((patch: Partial<MediaPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Preferences are a convenience; storage failure must not block joining.
      }
      return next;
    });
  }, []);

  return { preferences, update };
}

export interface DeviceLists {
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
}

/**
 * Enumerates input/output devices.
 *
 * Labels stay empty until the user has granted permission at least once, so the
 * list is re-read after any successful getUserMedia call and on devicechange.
 */
export function useDeviceLists() {
  const [devices, setDevices] = useState<DeviceLists>({
    cameras: [],
    microphones: [],
    speakers: [],
  });

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        cameras: all.filter((d) => d.kind === "videoinput"),
        microphones: all.filter((d) => d.kind === "audioinput"),
        speakers: all.filter((d) => d.kind === "audiooutput"),
      });
    } catch {
      // Enumeration can fail in locked-down contexts; leave the lists empty.
    }
  }, []);

  useEffect(() => {
    refresh();
    navigator.mediaDevices?.addEventListener?.("devicechange", refresh);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refresh);
  }, [refresh]);

  return { devices, refresh };
}

