"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  DisconnectReason,
  Room,
  RoomEvent,
  Track,
  type LocalVideoTrack,
  type RemoteParticipant,
} from "livekit-client";
import toast from "react-hot-toast";

import { useAuth } from "@/providers/AuthProvider";
import { meetingsApi } from "../api/meetings.api";
import {
  QUALITY_PRESETS,
  BACKDROP_COLORS,
  type MediaPreferences,
  type BackgroundEffect,
  type VideoQuality,
} from "./useMediaPreferences";

const BLUR_RADIUS: Partial<Record<BackgroundEffect, number>> = {
  "blur-light": 5,
  "blur-medium": 10,
  "blur-strong": 20,
};

/** Flat gradient backdrops, inlined so no extra asset request is needed. */
const BACKDROP_DATA_URLS: Partial<Record<BackgroundEffect, string>> = Object.fromEntries(
  Object.entries(BACKDROP_COLORS).map(([name, [from, to]]) => [
    name,
    "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/></svg>`
      ),
  ])
);

/**
 * Applies a background effect to the published camera track.
 *
 * The processor pulls a MediaPipe segmentation model, so it is imported lazily
 * and any failure degrades to "no effect" rather than breaking the camera.
 */
async function applyBackgroundEffect(room: Room, effect: BackgroundEffect) {
  const publication = room.localParticipant.getTrackPublication(Track.Source.Camera);
  const track = publication?.track as LocalVideoTrack | undefined;
  if (!track) return;

  try {
    const mod = await import("@livekit/track-processors");
    if (!mod.supportsBackgroundProcessors()) return;

    if (effect === "none") {
      await track.stopProcessor();
      return;
    }

    const blurRadius = BLUR_RADIUS[effect];
    if (blurRadius) {
      await track.setProcessor(
        mod.BackgroundProcessor({ mode: "background-blur", blurRadius })
      );
      return;
    }

    const gradient = BACKDROP_DATA_URLS[effect];
    if (gradient) {
      await track.setProcessor(
        mod.BackgroundProcessor({ mode: "virtual-background", imagePath: gradient })
      );
    }
  } catch {
    // Effects are optional; a missing model or unsupported browser is fine.
  }
}

/** Participant attribute used to broadcast the raised-hand flag. Attributes are
 *  replicated to late joiners, unlike data-channel messages. */
const HAND_ATTR = "hand_raised";

export interface LiveKitControls {
  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  toggleHandRaise: () => Promise<void>;
  setBackgroundEffect: (effect: BackgroundEffect) => Promise<void>;
  setVideoQuality: (quality: VideoQuality) => Promise<void>;
  switchDevice: (kind: MediaDeviceKind, deviceId: string) => Promise<void>;
}

export interface UseLiveKitRoomResult {
  room: Room | null;
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  canPublish: boolean;
  canShareScreen: boolean;
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  /** Raised-hand flags of remote participants, keyed by LiveKit identity. */
  remoteHands: Record<string, boolean>;
  controls: LiveKitControls;
  disconnect: () => Promise<void>;
}

/**
 * Owns the real-time media session for a meeting.
 *
 * The API refuses `media-token` until the caller is on the roster, so the join
 * goes through `media/join`, which registers the participant and mints the
 * LiveKit token in a single round trip.
 */
export function useLiveKitRoom(
  meetingId: number | string,
  options?: {
    password?: string | null;
    enabled?: boolean;
    preferences?: MediaPreferences | null;
  }
): UseLiveKitRoomResult {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const password = options?.password ?? undefined;
  const enabled = options?.enabled ?? true;
  const preferences = options?.preferences ?? null;
  // Held in a ref so changing preferences never re-runs the connect effect.
  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;

  const roomRef = useRef<Room | null>(null);
  // Guards against React 18 StrictMode double-invoking the connect effect.
  const connectingRef = useRef(false);

  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [error, setError] = useState<string | null>(null);
  const [canPublish, setCanPublish] = useState(true);
  const [canShareScreen, setCanShareScreen] = useState(true);

  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [remoteHands, setRemoteHands] = useState<Record<string, boolean>>({});

  // ─── Connect ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !meetingId || connectingRef.current) return;
    connectingRef.current = true;

    let cancelled = false;
    const startPrefs = prefsRef.current;
    const startPreset = startPrefs ? QUALITY_PRESETS[startPrefs.quality] : null;

    const lkRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
      // Without these a participant on speakers is echoed back to everyone.
      audioCaptureDefaults: {
        deviceId: startPrefs?.microphoneId || undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      videoCaptureDefaults: {
        deviceId: startPrefs?.cameraId || undefined,
        resolution: startPreset
          ? { width: startPreset.width, height: startPreset.height }
          : undefined,
      },
    });

    const syncLocalState = () => {
      const lp = lkRoom.localParticipant;
      setIsMicOn(lp.isMicrophoneEnabled);
      setIsCamOn(lp.isCameraEnabled);
      setIsScreenSharing(lp.isScreenShareEnabled);
    };

    const readHand = (p: RemoteParticipant) =>
      setRemoteHands((prev) => ({
        ...prev,
        [p.identity]: p.attributes?.[HAND_ATTR] === "1",
      }));

    lkRoom
      .on(RoomEvent.ConnectionStateChanged, setConnectionState)
      .on(RoomEvent.LocalTrackPublished, syncLocalState)
      .on(RoomEvent.LocalTrackUnpublished, syncLocalState)
      .on(RoomEvent.TrackMuted, syncLocalState)
      .on(RoomEvent.TrackUnmuted, syncLocalState)
      .on(RoomEvent.ParticipantAttributesChanged, (_changed, p) => {
        if (p !== lkRoom.localParticipant) readHand(p as RemoteParticipant);
      })
      .on(RoomEvent.ParticipantConnected, (p) => readHand(p))
      .on(RoomEvent.ParticipantDisconnected, (p) =>
        setRemoteHands((prev) => {
          const next = { ...prev };
          delete next[p.identity];
          return next;
        })
      )
      .on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
        setIsMicOn(false);
        setIsCamOn(false);
        setIsScreenSharing(false);
        // A silent drop looks identical to "audio and video stopped working",
        // so always say why — especially the duplicate-identity case, which
        // happens whenever the same account opens the room twice.
        const explain: Partial<Record<DisconnectReason, string>> = {
          [DisconnectReason.DUPLICATE_IDENTITY]:
            "You joined this meeting from another tab or device, so this session was disconnected.",
          [DisconnectReason.PARTICIPANT_REMOVED]: "You were removed from the meeting.",
          [DisconnectReason.ROOM_DELETED]: "The meeting was ended by the host.",
          [DisconnectReason.SERVER_SHUTDOWN]: "The media server restarted. Try rejoining.",
          [DisconnectReason.JOIN_FAILURE]: "Could not join the media room.",
        };
        const message = reason !== undefined ? explain[reason] : undefined;
        if (message) {
          setError(message);
          toast.error(message);
        }
      })
      .on(RoomEvent.Reconnecting, () => toast.loading("Reconnecting…", { id: "lk-reconnect" }))
      .on(RoomEvent.Reconnected, () => {
        toast.dismiss("lk-reconnect");
        toast.success("Reconnected");
      })
      .on(RoomEvent.MediaDevicesError, (e: Error) =>
        toast.error(`Device error: ${e.message}`)
      );

    (async () => {
      try {
        // `media/join` puts a row on the roster but leaves `connection_status`
        // at "disconnected", and chat/polls reject anyone who is not an *active*
        // participant ("You must be an active participant of this meeting").
        // `POST /join` is what flips that flag, so it has to run too — it
        // updates the existing row rather than adding a second one.
        await meetingsApi.join(role, meetingId, password ? { password } : undefined);

        const res = await meetingsApi.mediaJoin(role, meetingId, password);
        const media = (res as any)?.media ?? res;
        if (!media?.url || !media?.token) {
          throw new Error("Media server did not return a token");
        }
        if (cancelled) return;

        setCanPublish(media.can_publish !== false);
        setCanShareScreen(media.can_share_screen !== false);

        await lkRoom.connect(media.url, media.token);
        if (cancelled) {
          await lkRoom.disconnect();
          return;
        }

        roomRef.current = lkRoom;
        setRoom(lkRoom);
        setError(null);

        const prefs = prefsRef.current;
        if (prefs) {
          const preset = QUALITY_PRESETS[prefs.quality];
          // Switched independently: a device that vanished between setup and
          // join must not stop the others from being applied.
          const switchDeviceSafely = async (kind: MediaDeviceKind, id: string) => {
            if (!id) return;
            try {
              await lkRoom.switchActiveDevice(kind, id);
            } catch {
              // Fall back to the browser default for this kind.
            }
          };
          await switchDeviceSafely("videoinput", prefs.cameraId);
          await switchDeviceSafely("audioinput", prefs.microphoneId);
          await switchDeviceSafely("audiooutput", prefs.speakerId);

          if (prefs.microphoneEnabled) {
            try {
              await lkRoom.localParticipant.setMicrophoneEnabled(true);
            } catch (err: any) {
              toast.error(`Microphone failed to start: ${err?.message || "in use"}`);
            }
          }
          if (prefs.cameraEnabled) {
            try {
              await lkRoom.localParticipant.setCameraEnabled(true, {
                resolution: { width: preset.width, height: preset.height },
              });
              await applyBackgroundEffect(lkRoom, prefs.effect);
            } catch (err: any) {
              toast.error(`Camera failed to start: ${err?.message || "in use"}`);
            }
          }
          syncLocalState();
        }
        // Seed hands for participants already in the room.
        lkRoom.remoteParticipants.forEach((p) => readHand(p));
      } catch (err: any) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.message || err?.message || "Failed to join media";
        setError(msg);
        toast.error(msg);
      }
    })();

    return () => {
      cancelled = true;
      connectingRef.current = false;
      lkRoom.removeAllListeners();
      lkRoom.disconnect().catch(() => {});
      meetingsApi.mediaLeave(role, meetingId).catch(() => {});
      roomRef.current = null;
      setRoom(null);
    };
  }, [meetingId, role, password, enabled]);

  // ─── Controls ──────────────────────────────────────────────────────────────
  const guard = useCallback(
    (allowed: boolean, label: string) => {
      const lp = roomRef.current?.localParticipant;
      if (!lp) {
        toast.error("Not connected to the meeting yet");
        return null;
      }
      if (!allowed) {
        toast.error(`You are not allowed to ${label} in this meeting`);
        return null;
      }
      return lp;
    },
    []
  );

  const toggleMic = useCallback(async () => {
    const lp = guard(canPublish, "unmute");
    if (!lp) return;
    try {
      const next = !lp.isMicrophoneEnabled;
      await lp.setMicrophoneEnabled(next);
      setIsMicOn(next);
    } catch (err: any) {
      toast.error(`Could not access microphone: ${err?.message || "denied"}`);
    }
  }, [canPublish, guard]);

  const toggleCamera = useCallback(async () => {
    const lp = guard(canPublish, "turn on your camera");
    if (!lp) return;
    try {
      const next = !lp.isCameraEnabled;
      const prefs = prefsRef.current;
      const preset = prefs ? QUALITY_PRESETS[prefs.quality] : null;
      await lp.setCameraEnabled(
        next,
        preset ? { resolution: { width: preset.width, height: preset.height } } : undefined
      );
      setIsCamOn(next);
      if (next && prefs && roomRef.current) {
        await applyBackgroundEffect(roomRef.current, prefs.effect);
      }
    } catch (err: any) {
      toast.error(`Could not access camera: ${err?.message || "denied"}`);
    }
  }, [canPublish, guard]);

  const toggleScreenShare = useCallback(async () => {
    const lp = guard(canShareScreen, "share your screen");
    if (!lp) return;
    try {
      const next = !lp.isScreenShareEnabled;
      await lp.setScreenShareEnabled(next, { audio: true });
      setIsScreenSharing(next);
    } catch (err: any) {
      // The user dismissing the picker is not an error worth surfacing.
      if (err?.name !== "NotAllowedError" && err?.name !== "AbortError") {
        toast.error(`Screen share failed: ${err?.message || "unknown error"}`);
      }
    }
  }, [canShareScreen, guard]);

  const toggleHandRaise = useCallback(async () => {
    const lp = roomRef.current?.localParticipant;
    if (!lp) return;
    const next = !isHandRaised;
    setIsHandRaised(next);
    try {
      await lp.setAttributes({ ...lp.attributes, [HAND_ATTR]: next ? "1" : "0" });
    } catch {
      // Attribute sync is best-effort; the local indicator still reflects intent.
    }
  }, [isHandRaised]);

  const setBackgroundEffect = useCallback(async (effect: BackgroundEffect) => {
    if (roomRef.current) await applyBackgroundEffect(roomRef.current, effect);
  }, []);

  /**
   * Re-captures the camera at a new resolution.
   *
   * `setCameraEnabled` only reads its options when it publishes, so on an
   * already-published track it is a no-op — the capture has to be restarted for
   * the new constraints to take effect.
   */
  const setVideoQuality = useCallback(async (quality: VideoQuality) => {
    const track = roomRef.current?.localParticipant.getTrackPublication(
      Track.Source.Camera
    )?.track as LocalVideoTrack | undefined;
    if (!track) return;

    const preset = QUALITY_PRESETS[quality];
    try {
      await track.restartTrack({
        resolution: { width: preset.width, height: preset.height },
      });
    } catch (err: any) {
      toast.error(`Could not change quality: ${err?.message || "unavailable"}`);
    }
  }, []);

  const switchDevice = useCallback(async (kind: MediaDeviceKind, deviceId: string) => {
    try {
      await roomRef.current?.switchActiveDevice(kind, deviceId);
    } catch (err: any) {
      toast.error(`Could not switch device: ${err?.message || "unavailable"}`);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const lkRoom = roomRef.current;
    if (lkRoom) await lkRoom.disconnect();
    await meetingsApi.mediaLeave(role, meetingId).catch(() => {});
  }, [role, meetingId]);

  return {
    room,
    connectionState,
    isConnected: connectionState === ConnectionState.Connected,
    isConnecting:
      connectionState === ConnectionState.Connecting ||
      connectionState === ConnectionState.Reconnecting,
    error,
    canPublish,
    canShareScreen,
    isMicOn,
    isCamOn,
    isScreenSharing,
    isHandRaised,
    remoteHands,
    controls: {
      toggleMic,
      toggleCamera,
      toggleScreenShare,
      toggleHandRaise,
      setBackgroundEffect,
      setVideoQuality,
      switchDevice,
    },
    disconnect,
  };
}

export { Track };
