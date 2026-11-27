"use client";

import * as React from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, type Participant } from "livekit-client";

import { HAND_ATTRIBUTE } from "@/lib/live-room";

export type Cue = "join" | "leave" | "hand" | "message" | "mention";

// Short chimes made in the browser, so there are no sound files to load.
// Each note is [pitch in Hz, start in seconds].
const cues: Record<Cue, [number, number][]> = {
  join: [
    [587, 0],
    [880, 0.09],
  ],
  leave: [
    [784, 0],
    [523, 0.09],
  ],
  hand: [
    [1047, 0],
    [1319, 0.08],
    [1568, 0.16],
  ],
  message: [[1175, 0]],
  mention: [
    [880, 0],
    [1175, 0.07],
  ],
};

let context: AudioContext | null = null;
const lastPlayed: Partial<Record<Cue, number>> = {};

/** Plays a cue unless the same one just played, so a burst of joins is one chime. */
export function playCue(cue: Cue) {
  if (typeof window === "undefined" || !soundsOn()) return;
  const now = Date.now();
  if (now - (lastPlayed[cue] ?? 0) < 400) return;
  lastPlayed[cue] = now;

  context ??= new AudioContext();
  const audio = context;
  void audio.resume().then(() => {
    const start = audio.currentTime + 0.01;
    for (const [pitch, offset] of cues[cue]) {
      const at = start + offset;
      const tone = audio.createOscillator();
      const level = audio.createGain();
      tone.type = "sine";
      tone.frequency.value = pitch;
      level.gain.setValueAtTime(0, at);
      level.gain.linearRampToValueAtTime(0.07, at + 0.012);
      level.gain.exponentialRampToValueAtTime(0.0001, at + 0.32);
      tone.connect(level).connect(audio.destination);
      tone.start(at);
      tone.stop(at + 0.34);
    }
  }).catch(() => {});
}

const SOUNDS_KEY = "rise-live-room-sounds";
const SOUNDS_EVENT = "rise-live-room-sounds";

const soundsOn = () => localStorage.getItem(SOUNDS_KEY) !== "off";

export function setSoundsOn(on: boolean) {
  localStorage.setItem(SOUNDS_KEY, on ? "on" : "off");
  window.dispatchEvent(new Event(SOUNDS_EVENT));
}

function subscribeToSounds(onChange: () => void) {
  window.addEventListener(SOUNDS_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SOUNDS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** This person's choice to hear the room's sounds, on unless they turned it off. */
export function useSoundsOn() {
  return React.useSyncExternalStore(subscribeToSounds, soundsOn, () => true);
}

// Past this many people, comings and goings would chime all session.
const QUIET_ABOVE = 25;

/** Chimes when someone joins or leaves, and for hosts, when someone raises their hand. */
export function useRoomSounds({ hands }: { hands: boolean }) {
  const room = useRoomContext();

  React.useEffect(() => {
    const crowded = () => room.remoteParticipants.size > QUIET_ABOVE;
    const joined = () => !crowded() && playCue("join");
    const left = () => !crowded() && playCue("leave");
    const attributes = (changed: Record<string, string>, participant: Participant) => {
      if (hands && !participant.isLocal && changed[HAND_ATTRIBUTE]) playCue("hand");
    };
    room.on(RoomEvent.ParticipantConnected, joined);
    room.on(RoomEvent.ParticipantDisconnected, left);
    room.on(RoomEvent.ParticipantAttributesChanged, attributes);
    return () => {
      room.off(RoomEvent.ParticipantConnected, joined);
      room.off(RoomEvent.ParticipantDisconnected, left);
      room.off(RoomEvent.ParticipantAttributesChanged, attributes);
    };
  }, [room, hands]);
}
