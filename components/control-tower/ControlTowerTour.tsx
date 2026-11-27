"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { useCompanion } from "@/components/mascot/Companion";
import { InteractiveMascot } from "@/components/mascot/InteractiveMascot";
import { TEAL_PALETTE, type MascotMood } from "@/components/mascot/Mascot";
import { Spotlight } from "@/components/tour/Spotlight";
import { track } from "@/lib/analytics/track";
import { sessionQuery } from "@/lib/session-query";

/* Each step points at the element marked `data-tour="<target>"`. */
type TourStep = {
  target: string;
  title: string;
  body: string;
  mood: MascotMood;
};

export const controlTowerTourSteps: TourStep[] = [
  {
    target: "header",
    title: "Welcome to Control Tower",
    body: "This is your weekly check-in. Let me show you around. It takes less than a minute.",
    mood: "happy",
  },
  {
    target: "plan",
    title: "Plan your week",
    body: "Start each week here: what you're focusing on, and what you want to achieve.",
    mood: "thinking",
  },
  {
    target: "check-in",
    title: "Check in with your mentor",
    body: "After you meet your mentor, note what came out of it and how you're getting on.",
    mood: "happy",
  },
  {
    target: "reflection",
    title: "Reflect on the week",
    body: "Before the week ends, look back at what went well, what didn't and what you'll change.",
    mood: "thinking",
  },
  {
    target: "save",
    title: "Save before the deadline",
    body: "Saving marks the week Completed. A week left empty is marked Missed, but you can still fill it in later.",
    mood: "proud",
  },
  {
    target: "menu",
    title: "Look back any time",
    body: "Your previous weeks live in this menu, and so does this tour if you want it again.",
    mood: "celebrate",
  },
];

const seenKey = (userId: string) => `control-tower-tour-seen:${userId}`;

function readSeen(userId: string): boolean {
  try {
    return localStorage.getItem(seenKey(userId)) === "1";
  } catch {
    return false;
  }
}

function writeSeen(userId: string): void {
  try {
    localStorage.setItem(seenKey(userId), "1");
  } catch {
    /* Without storage the tour simply offers itself again next visit. */
  }
}

/* Opens the tour by itself the first time a student with Leafy planted comes
   to Control Tower, unless they've asked Leafy to stay quiet. `start` replays
   it from the page's menu. */
export function useControlTowerTour() {
  const { planted, quiet } = useCompanion();
  const userId = useQuery(sessionQuery()).data?.user.id;
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!userId || !planted || quiet || readSeen(userId)) return;
    /* Lets the page settle (and Leafy's own greeting rise) first. */
    const timer = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(timer);
  }, [userId, planted, quiet]);

  const close = React.useCallback(
    (finished: boolean) => {
      setOpen(false);
      if (userId) writeSeen(userId);
      track(finished ? "control_tower_tour_finished" : "control_tower_tour_skipped");
    },
    [userId],
  );

  const start = React.useCallback(() => {
    track("control_tower_tour_started");
    setOpen(true);
  }, []);

  return { open, start, close };
}

/* A guided walk through Control Tower with Leafy. Mount it only while the
   tour is open, so every run starts from the first step. */
export function ControlTowerTour({
  onClose,
}: {
  onClose: (finished: boolean) => void;
}): React.JSX.Element {
  const { growth, planted } = useCompanion();
  const [index, setIndex] = React.useState(0);
  const step = controlTowerTourSteps[index]!;
  const last = index === controlTowerTourSteps.length - 1;

  const next = React.useCallback(() => {
    if (last) onClose(true);
    else setIndex((current) => current + 1);
  }, [last, onClose]);
  const back = React.useCallback(
    () => setIndex((current) => Math.max(0, current - 1)),
    [],
  );
  const end = React.useCallback(() => onClose(false), [onClose]);

  return (
    <Spotlight
      target={step.target}
      title={step.title}
      body={step.body}
      index={index}
      count={controlTowerTourSteps.length}
      leading={
        planted && (
          <InteractiveMascot
            key={`mascot-${step.target}`}
            growth={growth}
            mood={step.mood}
            palette={TEAL_PALETTE}
            size={64}
            className="-mt-1 shrink-0"
            label="Leafy, your learning companion"
          />
        )
      }
      onClose={end}
      onNext={next}
      onBack={index > 0 ? back : undefined}
      nextLabel={last ? "Done" : "Next"}
    />
  );
}
