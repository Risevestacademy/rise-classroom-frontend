"use client";

import * as React from "react";
import { useMediaDevices, usePreviewTracks } from "@livekit/components-react";
import type { LocalAudioTrack, LocalVideoTrack } from "livekit-client";

import { AlertCircle, Mic02, MicOff02, Video, VideoOff } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import { cn } from "@/lib/utils";
import { gradientFor } from "./ParticipantTile";
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

  const microphones = useMediaDevices({ kind: "audioinput" });
  const cameras = useMediaDevices({ kind: "videoinput" });
  const level = useAudioLevel(audioTrack);

  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-8">
      <div className="grid w-full max-w-[960px] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div className="flex flex-col gap-4">
          <div
            className={cn(
              "relative isolate flex aspect-video items-center justify-center overflow-hidden rounded-[21px] bg-linear-to-b",
              gradientFor(userKey),
            )}
          >
            {choices?.videoEnabled && videoTrack ? (
              <video ref={videoRef} muted playsInline className="absolute inset-0 -z-10 size-full -scale-x-100 object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <PersonAvatar name={userName || "You"} colorKey={userKey} size={80} />
                <p className="font-work text-sm text-white/80">
                  {!choices?.videoEnabled ? "Your camera is off" : cameras.length === 0 ? "No camera found" : "Starting camera…"}
                </p>
              </div>
            )}

            <p className="absolute top-3 left-3 rounded-full bg-white/10 px-2.5 py-2 text-sm/5 font-medium text-white backdrop-blur-md">
              {userName || "You"}
            </p>

            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">
              <PreviewToggle
                on={Boolean(choices?.audioEnabled)}
                label={choices?.audioEnabled ? "Turn off microphone" : "Turn on microphone"}
                onClick={() => {
                  setProblem(null);
                  update({ audioEnabled: !choices?.audioEnabled });
                }}
              >
                {choices?.audioEnabled ? <Mic02 /> : <MicOff02 />}
                {choices?.audioEnabled && (
                  <span aria-hidden className="absolute inset-x-3 bottom-1.5 h-0.5 overflow-hidden rounded-full bg-white/20">
                    <span className="block h-full bg-room-active transition-[width] duration-100" style={{ width: `${Math.round(level * 100)}%` }} />
                  </span>
                )}
              </PreviewToggle>
              <PreviewToggle
                on={Boolean(choices?.videoEnabled)}
                label={choices?.videoEnabled ? "Turn off camera" : "Turn on camera"}
                onClick={() => {
                  setProblem(null);
                  update({ videoEnabled: !choices?.videoEnabled });
                }}
              >
                {choices?.videoEnabled ? <Video /> : <VideoOff />}
              </PreviewToggle>
            </div>
          </div>

          {problem && (
            <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-error-border bg-error-surface px-4 py-3 font-work text-sm text-text-error">
              <AlertCircle className="mt-0.5 size-[18px] shrink-0" />
              {deviceProblem(problem.kind, problem.error)}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <DeviceSelect
              label="Microphone"
              devices={microphones}
              value={choices?.audioDeviceId ?? ""}
              onChange={(audioDeviceId) => update({ audioDeviceId })}
            />
            <DeviceSelect
              label="Camera"
              devices={cameras}
              value={choices?.videoDeviceId ?? ""}
              onChange={(videoDeviceId) => update({ videoDeviceId })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 max-lg:items-center max-lg:text-center">
          <div className="flex flex-col gap-2">
            <p className="text-lg/6 font-semibold text-neutral-350">Ready to join?</p>
            <h1 className="text-2xl/8 font-semibold text-white">{title}</h1>
            <p className="font-work text-sm text-room-text-muted">{when}</p>
          </div>
          <p className="font-work text-sm text-room-text">
            You&apos;re joining as <span className="font-semibold text-white">{userName || "Guest"}</span>.{" "}
            {choices && !choices.audioEnabled && "You'll join muted."}
          </p>
          <button
            type="button"
            disabled={!choices || joining}
            onClick={() => choices && onJoin(choices)}
            className={cn(roomButton.primary, "h-11 w-full max-w-[320px] text-base")}
          >
            {joining && <Spinner />}
            {joining ? "Joining…" : "Join session"}
          </button>
        </div>
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
        "relative flex size-12 cursor-pointer items-center justify-center rounded-full backdrop-blur-md transition-colors focus-visible:outline-2 focus-visible:outline-white [&_svg]:size-5",
        on ? "bg-room-control/90 text-white hover:bg-room-control-hover" : "bg-room-off text-room-off-text hover:bg-[#ecc0c0]",
      )}
    >
      {children}
    </button>
  );
}

function DeviceSelect({
  label,
  devices,
  value,
  onChange,
}: {
  label: string;
  devices: MediaDeviceInfo[];
  value: string;
  onChange: (deviceId: string) => void;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-room-text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={devices.length === 0}
        className="h-10 w-full cursor-pointer truncate rounded-lg border border-room-border bg-room-bar px-3 text-sm text-room-text-strong outline-none focus:border-room-text-muted disabled:cursor-not-allowed disabled:text-room-text-muted"
      >
        {devices.length === 0 && <option value="">No {label.toLowerCase()} found</option>}
        {devices.length > 0 && <option value="">System default</option>}
        {devices
          .filter((device) => device.deviceId && device.deviceId !== "default")
          .map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `${label} ${index + 1}`}
            </option>
          ))}
      </select>
    </div>
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
