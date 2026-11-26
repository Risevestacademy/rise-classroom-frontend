"use client";

import * as React from "react";
import { isTrackReference, useSpeakingParticipants, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";

/** Safari's older way of floating a video, which iPhones still use. */
type FloatableVideo = HTMLVideoElement & {
  autoPictureInPicture?: boolean;
  webkitPresentationMode?: string;
  webkitSetPresentationMode?: (mode: "inline" | "picture-in-picture") => void;
};

const PIP = "picture-in-picture";

const noSubscription = () => () => {};
const canFloat = () =>
  typeof document !== "undefined" &&
  (Boolean(document.pictureInPictureEnabled) || "webkitSetPresentationMode" in HTMLVideoElement.prototype);

const isFloating = (video: FloatableVideo) =>
  document.pictureInPictureElement === video || video.webkitPresentationMode === PIP;

/**
 * The call in a small window that stays on screen over other apps. A phone
 * keeps a page that's playing video running, so the call is far less likely
 * to drop while they're away. It shows whoever's presenting, else the pinned
 * person, whoever spoke last, the host, anyone with a camera, then yourself.
 * Where the browser allows, it opens by itself when they leave the page.
 */
export function useFloatingVideo({ pinned, host }: { pinned?: string | null; host?: string }) {
  const ref = React.useRef<FloatableVideo>(null);
  const supported = React.useSyncExternalStore(noSubscription, canFloat, () => false);
  const [open, setOpen] = React.useState(false);

  const videos = useTracks([Track.Source.ScreenShare, Track.Source.Camera])
    .filter(isTrackReference)
    .filter((trackRef) => !trackRef.publication.isMuted && trackRef.publication.track);
  const speaker = useSpeakingParticipants().find((participant) => !participant.isLocal)?.identity;
  const [lastSpeaker, setLastSpeaker] = React.useState(speaker);
  if (speaker && speaker !== lastSpeaker) setLastSpeaker(speaker);

  const cameras = videos.filter((trackRef) => trackRef.source === Track.Source.Camera);
  const cameraOf = (identity?: string | null) => (identity ? cameras.find((trackRef) => trackRef.participant.identity === identity) : undefined);
  const shown =
    videos.find((trackRef) => trackRef.source === Track.Source.ScreenShare && !trackRef.participant.isLocal) ??
    cameraOf(pinned) ??
    cameraOf(lastSpeaker) ??
    cameraOf(host) ??
    cameras.find((trackRef) => !trackRef.participant.isLocal) ??
    cameras[0];
  const track = shown?.publication.track;

  React.useEffect(() => {
    const video = ref.current;
    if (!video || !track) return;
    track.attach(video);
    return () => void track.detach(video);
  }, [track]);

  React.useEffect(() => {
    const video = ref.current;
    if (!video || !supported) return;
    const update = () => setOpen(isFloating(video));
    video.addEventListener("enterpictureinpicture", update);
    video.addEventListener("leavepictureinpicture", update);
    video.addEventListener("webkitpresentationmodechanged", update);

    // Opening by itself when they leave the page: Safari's attribute, and Chrome's call controls.
    video.autoPictureInPicture = true;
    video.setAttribute("autopictureinpicture", "");
    const session = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
    const enter = () => void video.requestPictureInPicture?.().catch(() => {});
    try {
      session?.setActionHandler("enterpictureinpicture" as MediaSessionAction, enter);
    } catch {
      // This browser doesn't open it by itself.
    }

    return () => {
      video.removeEventListener("enterpictureinpicture", update);
      video.removeEventListener("leavepictureinpicture", update);
      video.removeEventListener("webkitpresentationmodechanged", update);
      try {
        session?.setActionHandler("enterpictureinpicture" as MediaSessionAction, null);
      } catch {}
    };
  }, [supported]);

  async function toggle() {
    const video = ref.current;
    if (!video) return;
    if (document.pictureInPictureElement === video) return document.exitPictureInPicture();
    if (video.webkitPresentationMode === PIP) return video.webkitSetPresentationMode?.("inline");
    await video.play().catch(() => {});
    if (document.pictureInPictureEnabled && video.requestPictureInPicture) await video.requestPictureInPicture();
    else video.webkitSetPresentationMode?.(PIP);
  }

  // Invisible but on the page and full size, since browsers won't float a video they can't play,
  // and LiveKit sends a picture sized to the element.
  const element = supported ? (
    <video
      ref={ref}
      muted
      playsInline
      autoPlay
      aria-hidden
      tabIndex={-1}
      className="pointer-events-none fixed top-0 left-0 -z-10 aspect-video w-80 opacity-0"
    />
  ) : null;

  return { element, supported, open, available: Boolean(track), toggle };
}
