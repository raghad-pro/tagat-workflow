"use client";

import React, { useEffect, useState } from "react";
import { Volume2, Mic, MicOff, Video as VideoIcon, VideoOff } from "lucide-react";
import { Room, Track, createAudioAnalyser, type LocalAudioTrack } from "livekit-client";

import { cn } from "@/lib/utils";
import {
  useDeviceLists,
  QUALITY_PRESETS,
  type MediaPreferences,
  type VideoQuality,
  type BackgroundEffect,
} from "../../hooks/useMediaPreferences";
import type { LiveKitControls } from "../../hooks/useLiveKitRoom";

const EFFECTS: { value: BackgroundEffect; label: string }[] = [
  { value: "none", label: "None" },
  { value: "blur-light", label: "Light blur" },
  { value: "blur-medium", label: "Blur" },
  { value: "blur-strong", label: "Strong blur" },
  { value: "graphite", label: "Graphite" },
  { value: "dusk", label: "Dusk" },
  { value: "teal", label: "Teal" },
];

/**
 * Live input level of the published microphone track.
 *
 * Reads the track the room is already publishing rather than opening a second
 * `getUserMedia` stream — a second capture of the same device is what makes the
 * mic show up as "in use" and fail on Windows.
 */
function useLocalMicLevel(room: Room | null, micOn: boolean) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!room || !micOn) {
      setLevel(0);
      return;
    }

    const track = room.localParticipant.getTrackPublication(Track.Source.Microphone)
      ?.track as LocalAudioTrack | undefined;
    if (!track) {
      setLevel(0);
      return;
    }

    let frame = 0;
    let stopped = false;
    let analyser: { calculateVolume: () => number; cleanup: () => Promise<void> };

    try {
      analyser = createAudioAnalyser(track, { fftSize: 256 });
    } catch {
      // A meter is a nicety; never let it break the settings panel.
      return;
    }

    const tick = () => {
      if (stopped) return;
      // `calculateVolume` returns 0…1 but normal speech sits low in that range,
      // so scale it up to make the bar readable.
      setLevel(Math.min(100, Math.round(analyser.calculateVolume() * 250)));
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      void analyser.cleanup();
    };
  }, [room, micOn]);

  return level;
}

interface MeetingSettingsPanelProps {
  room: Room | null;
  preferences: MediaPreferences;
  update: (patch: Partial<MediaPreferences>) => void;
  controls: LiveKitControls;
  isMicOn: boolean;
  isCamOn: boolean;
  canPublish: boolean;
}

const selectClass =
  "h-9 w-full rounded-lg bg-[#0D1117] border border-[#1E293B] px-2 text-[12px] text-white focus:outline-none focus:border-[#25C6DA]";
const sectionTitleClass =
  "text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]";

/**
 * Device and background settings, live inside the room.
 *
 * Every control acts on the running session immediately — there is no "apply"
 * step and no separate preview capture, so what the panel shows is what the
 * other participants are getting.
 */
export default function MeetingSettingsPanel({
  room,
  preferences,
  update,
  controls,
  isMicOn,
  isCamOn,
  canPublish,
}: MeetingSettingsPanelProps) {
  const { devices, refresh } = useDeviceLists();
  const level = useLocalMicLevel(room, isMicOn);

  // Device labels stay blank until a capture has been granted, so re-read them
  // whenever the user turns something on from in here.
  useEffect(() => {
    if (isMicOn || isCamOn) refresh();
  }, [isMicOn, isCamOn, refresh]);

  const playTestSound = () => {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.65);
    setTimeout(() => ctx.close().catch(() => {}), 900);
  };

  const handleCameraChange = async (deviceId: string) => {
    update({ cameraId: deviceId });
    await controls.switchDevice("videoinput", deviceId);
  };

  const handleMicrophoneChange = async (deviceId: string) => {
    update({ microphoneId: deviceId });
    await controls.switchDevice("audioinput", deviceId);
  };

  const handleSpeakerChange = async (deviceId: string) => {
    update({ speakerId: deviceId });
    await controls.switchDevice("audiooutput", deviceId);
  };

  const handleQualityChange = async (quality: VideoQuality) => {
    update({ quality });
    await controls.setVideoQuality(quality);
  };

  const handleEffectChange = async (effect: BackgroundEffect) => {
    update({ effect });
    await controls.setBackgroundEffect(effect);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Quick toggles ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void controls.toggleCamera()}
          disabled={!canPublish}
          className={cn(
            "flex items-center justify-center gap-2 h-9 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
            isCamOn
              ? "bg-[#25C6DA] text-white"
              : "bg-[#0D1117] text-white border border-[#1E293B] hover:bg-[#1E293B]"
          )}
        >
          {isCamOn ? <VideoIcon size={14} /> : <VideoOff size={14} />}
          Camera
        </button>
        <button
          type="button"
          onClick={() => void controls.toggleMic()}
          disabled={!canPublish}
          className={cn(
            "flex items-center justify-center gap-2 h-9 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
            isMicOn
              ? "bg-[#25C6DA] text-white"
              : "bg-[#0D1117] text-white border border-[#1E293B] hover:bg-[#1E293B]"
          )}
        >
          {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
          Microphone
        </button>
      </div>

      {/* ── Camera ────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <h3 className={sectionTitleClass}>Camera</h3>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-[#94A3B8]">Device</span>
          <select
            value={preferences.cameraId}
            onChange={(e) => void handleCameraChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Default</option>
            {devices.cameras.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-[#94A3B8]">Quality</span>
          <select
            value={preferences.quality}
            onChange={(e) => void handleQualityChange(e.target.value as VideoQuality)}
            className={selectClass}
          >
            {(Object.keys(QUALITY_PRESETS) as VideoQuality[]).map((q) => (
              <option key={q} value={q}>
                {QUALITY_PRESETS[q].label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* ── Background ────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <h3 className={sectionTitleClass}>Background</h3>
        <div className="flex flex-wrap gap-1.5">
          {EFFECTS.map((fx) => (
            <button
              key={fx.value}
              type="button"
              onClick={() => void handleEffectChange(fx.value)}
              className={cn(
                "px-2.5 h-7 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer",
                preferences.effect === fx.value
                  ? "bg-[#25C6DA] text-white border-[#25C6DA]"
                  : "bg-[#0D1117] text-[#94A3B8] border-[#1E293B] hover:text-white"
              )}
            >
              {fx.label}
            </button>
          ))}
        </div>
        {!isCamOn && (
          <p className="text-[10px] text-[#475569]">
            Turn your camera on to see the effect.
          </p>
        )}
      </section>

      {/* ── Microphone ────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <h3 className={sectionTitleClass}>Microphone</h3>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-[#94A3B8]">Device</span>
          <select
            value={preferences.microphoneId}
            onChange={(e) => void handleMicrophoneChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Default</option>
            {devices.microphones.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-[#94A3B8]">Level</span>
          <div className="h-2 rounded-full bg-[#0D1117] border border-[#1E293B] overflow-hidden">
            <div
              className="h-full bg-[#22C55E] transition-[width] duration-75"
              style={{ width: `${level}%` }}
            />
          </div>
          <span className="text-[10px] text-[#475569]">
            {isMicOn
              ? "Speak — the bar should move."
              : "Turn your microphone on to see the level."}
          </span>
        </div>
      </section>

      {/* ── Speaker ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <h3 className={sectionTitleClass}>Speaker</h3>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-[#94A3B8]">Device</span>
          <select
            value={preferences.speakerId}
            onChange={(e) => void handleSpeakerChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Default</option>
            {devices.speakers.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Speaker ${d.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={playTestSound}
          className="h-9 rounded-lg bg-[#0D1117] border border-[#1E293B] text-[12px] flex items-center justify-center gap-2 hover:border-[#25C6DA] cursor-pointer"
        >
          <Volume2 size={14} />
          Play test sound
        </button>
      </section>
    </div>
  );
}
