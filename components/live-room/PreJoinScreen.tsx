"use client";

import * as React from "react";
import { useMediaDevices, usePreviewTracks } from "@livekit/components-react";
import type { LocalAudioTrack, LocalVideoTrack } from "livekit-client";

import { AlertCircle, AudioLines, Mic02, MicOff02, Video, VideoOff } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import { cn } from "@/lib/utils";
import { roomButton } from "./RoomStatus";
import { Spinner } from "./RoomStage";

export type DeviceChoices = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  audioDeviceId: string;
  videoDeviceId: string;
};

const CHOICES_KEY = "rise-live-room-devices";
const defaultChoices: DeviceChoices = { audioEnabled: false, videoEnabled: true, audioDeviceId: "", videoDeviceId: "" };

const noSubscription = () => () => {};
const readSaved = () => localStorage.getItem(CHOICES_KEY) ?? "{}";

function parseChoices(saved: string): DeviceChoices {
  try {
    return { ...defaultChoices, ...JSON.parse(saved) };
  } catch {
    return defaultChoices;
  }
}

/** The devices picked last time on this browser. Only call it in the browser. */
export const readSavedChoices = () => parseChoices(readSaved());

export const saveChoices = (choices: DeviceChoices) => localStorage.setItem(CHOICES_KEY, JSON.stringify(choices));

/** Check your camera and microphone before going in. */
export function PreJoinScreen({
  title,
  when,
  userName,
  userKey,
  joining,
  onJoin,
}: {
  title: string;
  when: string;
  userName: string;
  userKey: string;
  joining: boolean;
  onJoin: (choices: DeviceChoices) => void;
}) {
  // The last devices used on this browser; `null` on the server, where there's no storage.
  const saved = React.useSyncExternalStore(noSubscription, readSaved, () => null);
  const [changes, setChanges] = React.useState<Partial<DeviceChoices>>({});
  const choices = saved === null ? null : { ...parseChoices(saved), ...changes };
  const [problem, setProblem] = React.useState<{ kind: "audio" | "video"; error: Error } | null>(null);

  const update = (patch: Partial<DeviceChoices>) =>
    setChanges((current) => {
      const next = { ...current, ...patch };
      localStorage.setItem(CHOICES_KEY, JSON.stringify({ ...parseChoices(readSaved()), ...next }));
      return next;
    });

  const audioEnabled = choices?.audioEnabled ?? false;
  const videoEnabled = choices?.videoEnabled ?? false;
  const audioDeviceId = choices?.audioDeviceId || undefined;
  const videoDeviceId = choices?.videoDeviceId || undefined;
  const audioOptions = React.useMemo(
    () => ({ audio: audioEnabled ? { deviceId: audioDeviceId } : false, video: false }),
    [audioEnabled, audioDeviceId],
  );
  const videoOptions = React.useMemo(
    () => ({ audio: false, video: videoEnabled ? { deviceId: videoDeviceId } : false }),
    [videoEnabled, videoDeviceId],
  );

  // Whatever fails is switched off, so the preview recovers instead of retrying forever.
  const audioTrack = usePreviewTracks(audioOptions, (error) => {
    setProblem({ kind: "audio", error });
    update({ audioEnabled: false });
  })?.[0] as LocalAudioTrack | undefined;
  const videoTrack = usePreviewTracks(videoOptions, (error) => {
    setProblem({ kind: "video", error });
    update({ videoEnabled: false });
  })?.[0] as LocalVideoTrack | undefined;
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const element = videoRef.current;
    if (!element || !videoTrack) return;
    videoTrack.attach(element);
    return () => {
      videoTrack.detach(element);
    };
  }, [videoTrack]);

  const cameras = useMediaDevices({ kind: "videoinput" });
  const level = useAudioLevel(audioTrack);
  const name = userName || "You";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 overflow-y-auto px-4 py-8">
      <div className="flex w-full max-w-[600px] flex-col gap-4">
        <div className="relative isolate flex aspect-[3/2] flex-col items-center overflow-hidden rounded-[32px] bg-room-canvas px-6 pt-10 pb-6 max-sm:aspect-[4/5]">
          {videoEnabled && videoTrack && (
            <video ref={videoRef} muted playsInline className="absolute inset-0 -z-10 size-full -scale-x-100 object-cover" />
          )}

          <p className="flex items-center gap-3">
            <span className="rounded-full bg-white/10 px-2 py-2 text-sm/5 font-medium text-white backdrop-blur-md">{name}</span>
            {audioEnabled && (
              <span
                role="img"
                aria-label={level > 0.15 ? "We can hear you" : "Microphone on"}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border border-info-border bg-info-text text-white transition-transform [&_svg]:size-3",
                  level > 0.15 && "scale-110",
                )}
              >
                <AudioLines />
              </span>
            )}
          </p>

          <div className="flex flex-1 items-center justify-center">
            {!(videoEnabled && videoTrack) && (
              <PersonAvatar name={name} colorKey={userKey} size={80} className="size-[82px]" />
            )}
          </div>

          <p className="flex flex-col items-center gap-1 text-sm/5 font-medium text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">
            <span>Microphone is {audioEnabled ? "on" : "off"}</span>
            <span>
              {videoEnabled && !videoTrack && cameras.length === 0
                ? "No camera found"
                : videoEnabled && !videoTrack
                  ? "Starting camera…"
                  : `Camera is ${videoEnabled ? "on" : "off"}`}
            </span>
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <PreviewToggle
              on={audioEnabled}
              label={audioEnabled ? "Turn off microphone" : "Turn on microphone"}
              onClick={() => {
                setProblem(null);
                update({ audioEnabled: !audioEnabled });
              }}
            >
              {audioEnabled ? <Mic02 /> : <MicOff02 />}
            </PreviewToggle>
            <PreviewToggle
              on={videoEnabled}
              label={videoEnabled ? "Turn off camera" : "Turn on camera"}
              onClick={() => {
                setProblem(null);
                update({ videoEnabled: !videoEnabled });
              }}
            >
              {videoEnabled ? <Video /> : <VideoOff />}
            </PreviewToggle>
          </div>
        </div>

        {problem && (
          <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-error-border bg-error-surface px-4 py-3 text-sm text-text-error">
            <AlertCircle className="mt-0.5 size-[18px] shrink-0" />
            {deviceProblem(problem.kind, problem.error)}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl/8 font-semibold text-text-primary">{title}</h1>
          <p className="text-xl/7 font-semibold text-text-secondary">{when}</p>
        </div>
        <button
          type="button"
          disabled={!choices || joining}
          onClick={() => choices && onJoin(choices)}
          className={roomButton.primary}
        >
          {joining && <Spinner />}
          {joining ? "Joining…" : "Join live session"}
        </button>
      </div>
    </div>
  );
}

function PreviewToggle({
  on,
  label,
  onClick,
  children,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex size-11 cursor-pointer items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&_svg]:size-5",
        on ? "bg-room-control text-white hover:bg-room-control-hover" : "bg-room-off text-room-off-text hover:bg-[#ecc0c0]",
      )}
    >
      {children}
    </button>
  );
}

function deviceProblem(kind: "audio" | "video", error: Error) {
  const device = kind === "audio" ? "microphone" : "camera";
  if (error.name === "NotAllowedError")
    return `Your browser is blocking the ${device}. Click the camera icon in the address bar to allow it, then turn it back on. You can still join without it.`;
  if (error.name === "NotFoundError") return `We couldn't find a ${device}. You can still join and listen in.`;
  if (error.name === "NotReadableError") return `Another app is using your ${device}. Close it, then turn it back on.`;
  return `Couldn't start your ${device}. You can still join without it.`;
}

/** A rough 0–1 input level, so people can see their mic is picking them up. */
function useAudioLevel(track?: LocalAudioTrack) {
  const [level, setLevel] = React.useState(0);

  React.useEffect(() => {
    if (!track) return;
    const context = new AudioContext();
    const source = context.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / data.length;
      setLevel(Math.min(1, average / 60));
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      context.close();
      setLevel(0);
    };
  }, [track]);

  return level;
}
