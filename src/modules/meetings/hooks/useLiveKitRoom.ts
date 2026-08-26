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
import { useTranslations } from "next-intl";

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
 * Turns the camera on at the best size it will actually accept.
 *
 * A webcam that cannot produce the requested resolution rejects the request
 * outright instead of negotiating down, so a saved quality of 720p locks the
 * owner of a 480p camera out of video entirely. Step down through the presets
 * and finish with an unconstrained attempt, which any working camera satisfies.
 */
async function enableCameraWithFallback(
  participant: Room["localParticipant"],
  preferred: VideoQuality | null
) {
  const order: VideoQuality[] = ["high", "balanced", "low"];
  const ladder = preferred
    ? order.slice(order.indexOf(preferred)).filter(Boolean)
    : [];

  for (const quality of ladder) {
    const preset = QUALITY_PRESETS[quality];
    try {
      await participant.setCameraEnabled(true, {
        resolution: { width: preset.width, height: preset.height },
      });
      return;
    } catch (err: any) {
      if (err?.name !== "OverconstrainedError" && err?.name !== "NotFoundError") {
        throw err;
      }
      // Too big for this camera — try the next size down.
    }
  }

  // Whatever the camera offers by default.
  await participant.setCameraEnabled(true);
}

/** Applying an effect must never cost the user their camera, so a processor
 *  that will not start is given a bounded amount of time and then abandoned. */
const PROCESSOR_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timed out")), ms)
    ),
  ]);
}

/**
 * Applies a background effect to the published camera track.
 *
 * The processor pulls a MediaPipe segmentation model, so it is imported lazily
 * and any failure degrades to "no effect" rather than breaking the camera.
 */
/** Message lookup, passed in because this runs outside the hook. */
type Translate = (key: string, values?: Record<string, string | number>) => string;

async function applyBackgroundEffect(
  room: Room,
  effect: BackgroundEffect,
  t: Translate
) {
  const publication = room.localParticipant.getTrackPublication(Track.Source.Camera);
  const track = publication?.track as LocalVideoTrack | undefined;
  if (!track) return;

  try {
    const mod = await withTimeout(
      import("@livekit/track-processors"),
      PROCESSOR_TIMEOUT_MS
    );
    if (!mod.supportsBackgroundProcessors()) {
      if (effect !== "none") {
        toast.error(t("effectsUnsupported"));
      }
      return;
    }

    if (effect === "none") {
      await track.stopProcessor();
      return;
    }

    const blurRadius = BLUR_RADIUS[effect];
    const processor = blurRadius
      ? mod.BackgroundProcessor({ mode: "background-blur", blurRadius })
      : BACKDROP_DATA_URLS[effect]
        ? mod.BackgroundProcessor({
            mode: "virtual-background",
            imagePath: BACKDROP_DATA_URLS[effect],
          })
        : null;
    if (!processor) return;

    // Detach whatever is attached before binding a new processor. Turning the
    // camera off and on again publishes a *new* track while the previous
    // processor is still bound, and stacking a second one on top produced a
    // track that stayed at 0x0 — the camera looked on and sent nothing.
    try {
      await track.stopProcessor();
    } catch {
      // Nothing was attached; that is the normal first-run case.
    }

    await withTimeout(track.setProcessor(processor), PROCESSOR_TIMEOUT_MS);
  } catch {
    // A half-attached processor leaves the camera published but producing no
    // frames — and because this used to fail silently, picking a background
    // simply killed the camera with nothing to explain it. Detach and say so.
    try {
      await track.stopProcessor();
    } catch {
      // Nothing else to try; the raw track is still published.
    }
    toast.error(t("effectFailed"));
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
  /**
   * Identifies the current connect attempt.
   *
   * Every run of the effect claims the next number and re-checks it after each
   * `await`; a run whose number has been superseded stops and tears its own
   * room down. Without this, StrictMode's double-invoke plus the re-run caused
   * by `role` settling as auth loads opened several LiveKit sessions under the
   * same identity — and LiveKit answers a duplicate identity by kicking the
   * older session, so they knocked each other offline and the room ended up
   * disconnected with "you joined from another tab".
   *
   * A plain "already connecting" boolean cannot express this: the cleanup that
   * releases it runs *before* the next attempt starts, so it never blocked the
   * second connect — while the attempt it did block left no room at all.
   */
  const attemptRef = useRef(0);

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

  const t = useTranslations("meetings.errors");
  // Held in a ref on purpose. The connection effect below must not list
  // the translator among its dependencies — re-running it would tear down
  // a live room and rejoin it just because the language changed — yet its
  // event listeners outlive the render that created them and still need
  // the current one.
  const tRef = useRef(t);
  tRef.current = t;

  // ─── Connect ───────────────────────────────────────────────────────────────
  useEffect(() => {
    // Wait for auth before connecting: `role` decides the API prefix, and
    // letting it settle from its fallback to the real value would otherwise
    // re-run this effect and open a second session.
    if (!enabled || !meetingId || !user) return;

    const attempt = ++attemptRef.current;
    const isStale = () => attemptRef.current !== attempt;

    const startPrefs = prefsRef.current;

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
      // Deliberately no `resolution` here. Room defaults are merged into every
      // capture, so a resolution parked on them survives even a call that
      // passes no options — which made the "retry without the constraint"
      // fallback below re-send a constraint and fail exactly the same way.
      // Quality is always passed explicitly at the call site instead.
      videoCaptureDefaults: {
        deviceId: startPrefs?.cameraId || undefined,
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
          [DisconnectReason.DUPLICATE_IDENTITY]: tRef.current("duplicateSession"),
          [DisconnectReason.PARTICIPANT_REMOVED]: tRef.current("removed"),
          [DisconnectReason.ROOM_DELETED]: tRef.current("roomDeleted"),
          [DisconnectReason.SERVER_SHUTDOWN]: tRef.current("serverShutdown"),
          [DisconnectReason.JOIN_FAILURE]: tRef.current("joinFailure"),
        };
        const message = reason !== undefined ? explain[reason] : undefined;
        if (message) {
          setError(message);
          toast.error(message);
        }
      })
      .on(RoomEvent.Reconnecting, () => toast.loading(tRef.current("reconnecting"), { id: "lk-reconnect" }))
      .on(RoomEvent.Reconnected, () => {
        toast.dismiss("lk-reconnect");
        toast.success(tRef.current("reconnected"));
      })
      .on(RoomEvent.MediaDevicesError, (e: Error) =>
        toast.error(tRef.current("deviceError", { message: e.message }))
      );

    (async () => {
      try {
        // `media/join` puts a row on the roster but leaves `connection_status`
        // at "disconnected", and chat/polls reject anyone who is not an *active*
        // participant ("You must be an active participant of this meeting").
        // `POST /join` is what flips that flag, so it has to run too — it
        // updates the existing row rather than adding a second one.
        await meetingsApi.join(role, meetingId, password ? { password } : undefined);
        if (isStale()) return;

        const res = await meetingsApi.mediaJoin(role, meetingId, password);
        const media = (res as any)?.media ?? res;
        if (!media?.url || !media?.token) {
          throw new Error(tRef.current("noToken"));
        }
        if (isStale()) return;

        setCanPublish(media.can_publish !== false);
        setCanShareScreen(media.can_share_screen !== false);

        await lkRoom.connect(media.url, media.token);
        if (isStale()) {
          // A newer attempt owns the identity now; leaving this one connected
          // would get that one kicked for a duplicate identity.
          await lkRoom.disconnect();
          return;
        }

        roomRef.current = lkRoom;
        setRoom(lkRoom);
        setError(null);

        const prefs = prefsRef.current;
        if (prefs) {
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
              await enableCameraWithFallback(lkRoom.localParticipant, prefs.quality);
              await applyBackgroundEffect(lkRoom, prefs.effect, tRef.current);
            } catch (err: any) {
              toast.error(`Camera failed to start: ${err?.message || "in use"}`);
            }
          }
          syncLocalState();
        }
        // Seed hands for participants already in the room.
        lkRoom.remoteParticipants.forEach((p) => readHand(p));
      } catch (err: any) {
        if (isStale()) return;
        const msg =
          err?.response?.data?.message || err?.message || tRef.current("joinFailed");
        setError(msg);
        toast.error(msg);
      }
    })();

    return () => {
      // Retire this attempt so its in-flight continuation sees itself as stale
      // even when no newer attempt follows (an unmount).
      attemptRef.current++;
      lkRoom.removeAllListeners();
      lkRoom.disconnect().catch(() => {});
      meetingsApi.mediaLeave(role, meetingId).catch(() => {});
      // Only surrender the shared refs if this attempt is the one holding them;
      // a superseded teardown must not blank out the live room.
      if (roomRef.current === lkRoom) {
        roomRef.current = null;
        setRoom(null);
      }
    };
  }, [meetingId, role, password, enabled, user]);

  // ─── Controls ──────────────────────────────────────────────────────────────
  const guard = useCallback(
    (allowed: boolean, deniedKey: string) => {
      const lp = roomRef.current?.localParticipant;
      if (!lp) {
        toast.error(tRef.current("notConnected"));
        return null;
      }
      // Browsers expose `mediaDevices` only in a secure context. Served over
      // plain HTTP from anything but localhost — a LAN IP such as
      // http://192.168.1.5:3000, which is how a second device usually reaches a
      // dev server — the whole API is simply absent, so the buttons look dead
      // and nothing explains why.
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error(
          window.isSecureContext
            ? tRef.current("noMediaSupport")
            : tRef.current("httpsRequired")
        );
        return null;
      }
      if (!allowed) {
        toast.error(tRef.current(deniedKey));
        return null;
      }
      return lp;
    },
    []
  );

  const toggleMic = useCallback(async () => {
    const lp = guard(canPublish, "notAllowedMic");
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
    const lp = guard(canPublish, "notAllowedCamera");
    if (!lp) return;

    const next = !lp.isCameraEnabled;
    const prefs = prefsRef.current;

    try {
      if (next) {
        await enableCameraWithFallback(lp, prefs?.quality ?? null);
      } else {
        await lp.setCameraEnabled(false);
      }

      setIsCamOn(next);
    } catch (err: any) {
      // Say which of the handful of real causes this is; "denied" sent people
      // to their browser settings when the camera was simply already in use.
      const reason =
        {
          NotAllowedError:
            "permission was blocked — allow the camera in the address bar",
          NotFoundError: "no camera was found on this device",
          NotReadableError:
            "another app is using it (close Zoom, Teams or your camera app)",
          OverconstrainedError: "this camera cannot produce the selected quality",
          AbortError: "the camera stopped unexpectedly",
        }[err?.name as string] || err?.message || "unknown error";
      toast.error(`Could not turn on the camera: ${reason}`);
      return;
    }

    // Applied after the camera is already live and reported, so a failing
    // effect can never be mistaken for the camera itself failing.
    if (next && prefs && roomRef.current) {
      await applyBackgroundEffect(roomRef.current, prefs.effect, tRef.current);
    }
  }, [canPublish, guard]);

  const toggleScreenShare = useCallback(async () => {
    const lp = guard(canShareScreen, "notAllowedScreenShare");
    if (!lp) return;
    try {
      const next = !lp.isScreenShareEnabled;
      await lp.setScreenShareEnabled(next, { audio: true });
      setIsScreenSharing(next);
    } catch (err: any) {
      // The user dismissing the picker is not an error worth surfacing.
      if (err?.name !== "NotAllowedError" && err?.name !== "AbortError") {
        toast.error(
          tRef.current("screenShareFailed", {
            message: err?.message || tRef.current("unknownError"),
          })
        );
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
    if (roomRef.current) await applyBackgroundEffect(roomRef.current, effect, tRef.current);
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
