"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Popover } from "@base-ui/react/popover";
import { useQuery } from "@tanstack/react-query";
import { Bell, BellOff, WifiOff, X } from "lucide-react";

import { useControlTowerData } from "@/components/control-tower/hooks";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SuccessToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/track";
import { liveSessionQueries, type LiveSession } from "@/lib/live-sessions";
import { sessionQuery } from "@/lib/session-query";
import { studentQueries } from "@/lib/student";
import { studentAssignmentQueries } from "@/lib/student-assignments";
import { continueLearning, upcomingDeadlines } from "@/lib/student-dashboard";
import { LESSONS_BASE, useStudentCurriculum } from "@/lib/student-lessons";
import { useCurrentMinute } from "@/lib/use-current-minute";
import { cn } from "@/lib/utils";
import { InteractiveMascot } from "./InteractiveMascot";
import { Mascot, TEAL_PALETTE, type MascotMood } from "./Mascot";
import {
  BLOOM,
  MASCOT_STAGES,
  growthFromLessons,
  lessonsToNextStage,
  type MascotStage,
} from "./growth";
import { ambientLife, dayKey, daysAway, recordVisit } from "./life";
import styles from "./mascot.module.css";
import { buildNudges, nudgeKind, type Nudge } from "./nudges";

const QUIET_KEY = "companion-quiet";
const POPPED_KEY = "companion-popped";
const SEEN_KEY = "companion-seen";
const SKIPS_KEY = "companion-pop-skips";
const VISITS_KEY = "companion-visits";
const PLANTED_KEY = "companion-planted";
const TUCKED_KEY = "companion-tucked";
/** Class heads-ups already given, so each is said once. */
const LIVE_HEARD_KEY = "companion-live-heard";
/** Daily pop-ups stop by themselves once this many in a row go unanswered. */
const MAX_SKIPS = 3;
const POP_MS = 12_000;
const CHEER_MS = 6_000;
const LIVE_POP_MS = 20_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const SINK_MS = 350;

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/**
 * Everything the companion remembers belongs to one student, so two accounts
 * on the same browser each get their own Leafy.
 */
function useScopedKey(name: string) {
  const userId = useQuery(sessionQuery()).data?.user.id ?? "guest";
  return `${name}:${userId}`;
}

/** A localStorage value that every companion on the page reads the same way. */
function useStored(name: string) {
  const key = useScopedKey(name);
  const value = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null,
  );
  const set = useCallback(
    (next: string) => {
      localStorage.setItem(key, next);
      listeners.forEach((listener) => listener());
    },
    [key],
  );
  return [value, set] as const;
}

/** False on the server and while the page wakes up, when nothing stored can be read yet. */
function useStorageReady() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

type Celebration = { nextHref?: string; stageBefore: MascotStage };
type Saying = Pick<Nudge, "message" | "mood" | "action">;

type CompanionValue = {
  nudges: Nudge[];
  /** False until the student's work has loaded, so the companion never guesses. */
  ready: boolean;
  stage: MascotStage;
  /** 0 to 6 with fractions, so the plant is a little bigger after every lesson. */
  growth: number;
  /** Lessons left before the next growth stage; 0 in bloom or before enrolling. */
  toNextStage: number;
  quiet: boolean;
  setQuiet: (value: boolean) => void;
  /** False until the student has planted the seed; Leafy stays out of sight until then. */
  planted: boolean;
  /** False for the first instant of a page load, before `planted` can be read. */
  plantedKnown: boolean;
  /** The moment after a lesson is marked complete. Skipped in quiet mode. */
  celebrateLesson: (celebration: Celebration) => void;
  /** A short pop-up for smaller wins, like handing work in. Skipped in quiet mode. */
  cheer: (message: string) => void;
  /* True while a pop-up's Leafy is rising from the bottom-right corner. */
  popping: boolean;
  /* Called by each pop-up as it mounts; returns its unmount cleanup. */
  registerPop: () => () => void;
};

const CompanionContext = createContext<CompanionValue | null>(null);

export function useCompanion() {
  const context = useContext(CompanionContext);
  if (!context) throw new Error("useCompanion must be used within CompanionProvider");
  return context;
}

/** `cheer` for code that also runs outside the student area, where it does nothing. */
export function useCompanionCheer() {
  const cheer = useContext(CompanionContext)?.cheer;
  return useCallback((message: string) => cheer?.(message), [cheer]);
}

/*
 * `celebrateLesson` for code that also renders outside the student area, where
 * it does nothing. Records the stage at call time so growth can be compared after.
 */
export function useCompanionCelebrate() {
  const context = useContext(CompanionContext);
  const celebrateLesson = context?.celebrateLesson;
  const stage = context?.stage ?? 0;
  return useCallback(
    (nextHref?: string) => celebrateLesson?.({ nextHref, stageBefore: stage }),
    [celebrateLesson, stage],
  );
}

const primaryAction =
  "inline-flex h-8 shrink-0 items-center rounded-lg bg-brand-primary px-3 text-xs font-medium text-white transition-colors hover:bg-brand-primary-hover focus-visible:ring-2 focus-visible:ring-border-focus";

/**
 * The companion's own day shows through when it has nothing pressing to say:
 * asleep at night, leaning to the morning sun, watered on Mondays.
 */
function atRest(mood: MascotMood) {
  const life = ambientLife();
  if (mood !== "happy" && mood !== "proud") return { mood, scene: undefined };
  return { mood: life.asleep ? ("sleepy" as const) : mood, scene: life.scene };
}

function growthLine(stage: MascotStage, toNextStage: number) {
  if (stage === BLOOM) return "In full bloom";
  return `${MASCOT_STAGES[stage]} · ${toNextStage} ${toNextStage === 1 ? "lesson" : "lessons"} to ${MASCOT_STAGES[stage + 1]}`;
}

/** Whether Leafy has been planted, and so may be shown. False outside the student area. */
export function useLeafyPlanted() {
  return useContext(CompanionContext)?.planted ?? false;
}

/** The companion as a still figure, for places like empty states. */
export function CompanionFigure({
  mood = "happy",
  size = 56,
}: {
  mood?: MascotMood;
  size?: number;
}) {
  const growth = useContext(CompanionContext)?.growth ?? 0;
  return (
    <span aria-hidden>
      <Mascot growth={growth} mood={mood} palette={TEAL_PALETTE} size={size} animated={false} />
    </span>
  );
}

/**
 * The companion looking worried, to stand in for the icon where something
 * failed to load. Before the seed is planted it is the plain icon.
 */
export function WorriedLeafy({ className }: { className?: string }) {
  const planted = useLeafyPlanted();
  if (!planted) return <WifiOff className={className} />;
  return <CompanionFigure mood="worried" size={48} />;
}

/**
 * The first time a student arrives: they plant the seed themselves, then meet
 * who grew from it. Students already part-way through skip straight to meeting.
 */
function LeafyIntro({
  open,
  growth,
  onDone,
}: {
  open: boolean;
  growth: number;
  onDone: () => void;
}) {
  const [justPlanted, setJustPlanted] = useState(false);
  const empty = growth === 0 && !justPlanted;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDone()}>
      <DialogContent className="w-88 text-center" showClose={false}>
        <div className="flex flex-col items-center">
          <Mascot
            growth={growth}
            planted={!empty}
            mood={empty ? "happy" : "celebrate"}
            palette={TEAL_PALETTE}
            size={168}
            label=""
          />
          <DialogTitle className="mt-2">{empty ? "Plant your seed" : "Meet Leafy"}</DialogTitle>
          <DialogDescription className="mt-1 text-neutral-500">
            {empty
              ? "This pot is yours. What grows in it grows with you."
              : growth > 0
                ? "Leafy has grown with every lesson you finished, and will point you to what matters each day."
                : "Leafy grows a little with every lesson you finish, and will point you to what matters each day."}
          </DialogDescription>
          <button
            type="button"
            onClick={() => {
              if (!empty) return onDone();
              track("leafy_planted");
              setJustPlanted(true);
            }}
            className={cn(primaryAction, "mt-6 h-10 w-full justify-center text-sm")}
          >
            {empty ? "Plant it" : "Let’s go"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LessonCelebration({
  celebration,
  stage,
  growth,
  toNextStage,
  onClose,
}: {
  celebration: Celebration | null;
  stage: MascotStage;
  growth: number;
  toNextStage: number;
  onClose: () => void;
}) {
  const bloomed = stage === BLOOM;
  return (
    <Dialog open={celebration !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-88 text-center">
        <div className="flex flex-col items-center">
          <Mascot growth={growth} mood="celebrate" palette={TEAL_PALETTE} size={168} label="" />
          <DialogTitle className="mt-2">
            {bloomed ? "Track complete" : "Lesson complete"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-neutral-500">
            {bloomed
              ? "That was the last lesson. Leafy is in full bloom."
              : celebration && stage > celebration.stageBefore
                ? `Leafy grew into ${MASCOT_STAGES[stage]}.`
                : `${toNextStage} more ${toNextStage === 1 ? "lesson" : "lessons"} to ${MASCOT_STAGES[stage + 1]}.`}
          </DialogDescription>
          <div className="mt-4 flex gap-1.5" aria-hidden>
            {MASCOT_STAGES.slice(1).map((name, index) => (
              <span
                key={name}
                className={cn(
                  "h-1.5 w-6 rounded-full",
                  index < stage ? "bg-brand-600" : "bg-neutral-200",
                )}
              />
            ))}
          </div>
          <div className="mt-6 flex w-full flex-col gap-2">
            {celebration?.nextHref && (
              <Link
                href={celebration.nextHref}
                onClick={onClose}
                className={cn(primaryAction, "h-10 justify-center text-sm")}
              >
                Next lesson
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg text-sm font-medium text-neutral-500 hover:bg-neutral-100"
            >
              {celebration?.nextHref ? "Stay here" : "Done"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SayingAction({ saying, onClick }: { saying: Saying; onClick?: () => void }) {
  if (!saying.action) return null;
  return (
    <Link href={saying.action.href} onClick={onClick} className={primaryAction}>
      {saying.action.label}
    </Link>
  );
}

/** The companion rising from the bottom of the screen to say one thing. */
function Pop({
  saying,
  growth,
  leaving,
  onDismiss,
  onAct = onDismiss,
}: {
  saying: Saying;
  growth: number;
  leaving: boolean;
  onDismiss: () => void;
  /** The student took the offered action, as opposed to waving it away. */
  onAct?: () => void;
}) {
  const registerPop = useContext(CompanionContext)?.registerPop;
  useEffect(() => registerPop?.(), [registerPop]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-3 bottom-0 z-40 flex items-end gap-2 sm:right-8",
        leaving ? styles.sinkOut : styles.riseIn,
      )}
    >
      <div
        role="status"
        className="pointer-events-auto mb-24 flex max-w-64 flex-col gap-3 rounded-2xl rounded-br-sm border border-neutral-200 bg-white p-4 shadow-lg"
      >
        <p className="text-sm text-neutral-700">{saying.message}</p>
        <div className="flex items-center gap-3">
          <SayingAction saying={saying} onClick={onAct} />
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-medium text-neutral-400 hover:text-neutral-700"
          >
            {saying.action ? "Later" : "Got it"}
          </button>
        </div>
      </div>
      <InteractiveMascot
        growth={growth}
        mood={saying.mood}
        palette={TEAL_PALETTE}
        size={128}
        className="pointer-events-auto translate-y-6"
        label="Leafy, your learning companion"
      />
    </div>
  );
}

/** Shows a pop for `ms`, then lets it sink before calling `onDone`. */
function useTimedPop(active: boolean, ms: number, onDone: (timedOut: boolean) => void) {
  const [leaving, setLeaving] = useState(false);
  const sink = useRef<ReturnType<typeof setTimeout>>(undefined);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  const dismiss = useCallback((timedOut = false) => {
    setLeaving(true);
    clearTimeout(sink.current);
    sink.current = setTimeout(() => {
      done.current(timedOut);
      setLeaving(false);
    }, SINK_MS);
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => dismiss(true), ms);
    return () => clearTimeout(timer);
  }, [active, ms, dismiss]);

  useEffect(() => () => clearTimeout(sink.current), []);

  return { leaving, dismiss };
}

/** Yesterday to the day after tomorrow, so a late class isn't lost to a time zone. Stable for the day. */
function liveWindow(today: string) {
  const start = new Date(`${today}T00:00:00`).getTime();
  return {
    from: new Date(start - DAY_MS).toISOString(),
    to: new Date(start + 2 * DAY_MS).toISOString(),
  };
}

/** A class is live, or starts within two hours. */
function classNear(sessions: LiveSession[]) {
  const soon = Date.now() + 2 * 60 * 60 * 1000;
  return sessions.some(
    (session) =>
      session.status === "live" ||
      (session.status === "upcoming" && Date.parse(session.startsAt) <= soon),
  );
}

/** Lessons, assignments and the class itself are left alone; the dot on Leafy still shows. */
const undisturbed = (path: string) =>
  path.startsWith(`${LESSONS_BASE}/lesson/`) ||
  /^\/student\/assignments\/[^/]+/.test(path) ||
  path.startsWith("/student/live");

/**
 * Wherever the student is, Leafy rises to say a class is about to start (15
 * minutes out) and again once it's live. Each is said once, and waits for any
 * other pop-up to finish first.
 */
function LiveHeadsUp({ nudges, growth, muted }: { nudges: Nudge[]; growth: number; muted: boolean }) {
  const pathname = usePathname();
  const popping = useContext(CompanionContext)?.popping ?? false;
  const [heard, setHeard] = useStored(LIVE_HEARD_KEY);
  const heardIds = heard ? heard.split("\n") : [];
  const [showing, setShowing] = useState<string | null>(null);

  const due = nudges.find(
    (nudge) =>
      nudge.urgent &&
      ["live-now", "live-soon"].includes(nudgeKind(nudge)) &&
      !heardIds.includes(nudge.id),
  );
  if (!showing && due && !muted && !popping && !undisturbed(pathname)) setShowing(due.id);
  const saying = nudges.find((nudge) => nudge.id === showing);

  const pop = useTimedPop(showing !== null, LIVE_POP_MS, (timedOut) => {
    if (showing) {
      track(`leafy_live_${timedOut ? "ignored" : "closed"}:${nudgeKind({ id: showing })}`);
      setHeard([...heardIds.slice(-20), showing].join("\n"));
    }
    setShowing(null);
  });
  useEffect(() => {
    if (showing) track(`leafy_live_shown:${nudgeKind({ id: showing })}`);
  }, [showing]);

  if (!showing || !saying) return null;
  return (
    <Pop
      saying={saying}
      growth={growth}
      leaving={pop.leaving}
      onDismiss={() => pop.dismiss()}
      onAct={() => {
        track(`leafy_live_acted:${nudgeKind(saying)}`);
        pop.dismiss();
      }}
    />
  );
}

/** Works out what the companion knows and holds the moments it can take over for. */
export function CompanionProvider({ children }: { children: ReactNode }) {
  const curriculum = useStudentCurriculum();
  const enrollmentId = curriculum.enrollmentId ?? "";
  const submissions = useQuery({
    ...studentAssignmentQueries.enrollmentSubmissions(enrollmentId),
    enabled: enrollmentId.length > 0,
  });
  // The same request the dashboard's deadlines card makes.
  const tasks = useQuery(studentQueries.weeklyTasks({ limit: 100 }));
  const tower = useControlTowerData();
  const now = useCurrentMinute();
  const live = useQuery({
    ...liveSessionQueries.list(liveWindow(dayKey())),
    // Checked every minute when a class is near, so "live now" shows soon after the host starts.
    refetchInterval: (query) => (classNear(query.state.data ?? []) ? 60_000 : 10 * 60_000),
  });

  const [visits, setVisits] = useStored(VISITS_KEY);
  const visitsKey = useScopedKey(VISITS_KEY);
  useEffect(() => {
    const stored = localStorage.getItem(visitsKey);
    const next = recordVisit(stored, dayKey());
    if (next !== stored) setVisits(next);
  }, [visitsKey, setVisits]);

  const [storedPlanted, setPlanted] = useStored(PLANTED_KEY);
  const planted = storedPlanted === "1";
  const plantedKnown = useStorageReady();
  const [, setPopped] = useStored(POPPED_KEY);

  const [storedQuiet, setStoredQuiet] = useStored(QUIET_KEY);
  const quiet = storedQuiet === "1";
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [cheering, setCheering] = useState<string | null>(null);
  const cheerPop = useTimedPop(cheering !== null, CHEER_MS, () => setCheering(null));
  const [pops, setPops] = useState(0);
  const registerPop = useCallback(() => {
    setPops((count) => count + 1);
    return () => setPops((count) => count - 1);
  }, []);
  // Other corner prompts (like turning on notifications) step aside while Leafy talks.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-leafy-talking", pops > 0);
    return () => document.documentElement.removeAttribute("data-leafy-talking");
  }, [pops]);

  const { enrollment, topics } = curriculum;
  const ready =
    !curriculum.isPending &&
    !tasks.isPending &&
    !(enrollmentId !== "" && submissions.isPending);

  const submitted = submissions.data?.items ?? [];
  const nudges = buildNudges({
    enrollment,
    notEnrolled: curriculum.notEnrolled,
    current: enrollment ? continueLearning(enrollment, topics) : null,
    deadlines: upcomingDeadlines(topics, submitted, tasks.data?.items ?? [], { limit: 10 }),
    submissions: submitted,
    controlTowerWeek: tower.weeks?.current,
    daysAway: daysAway(visits),
    topics,
    liveSessions: live.data ?? [],
    now: now === null ? undefined : new Date(now),
  });

  const completed = enrollment?.progress.completedLessons ?? 0;
  const total = enrollment?.progress.totalLessons ?? 0;
  const growth = growthFromLessons(completed, total);
  const stage = Math.floor(growth) as MascotStage;
  const toNextStage = total > 0 ? lessonsToNextStage(completed, total) : 0;

  const value: CompanionValue = {
    nudges,
    ready,
    stage,
    growth,
    toNextStage,
    quiet,
    setQuiet: (next) => {
      track(next ? "leafy_quiet_on" : "leafy_quiet_off");
      setStoredQuiet(next ? "1" : "0");
    },
    planted,
    plantedKnown,
    celebrateLesson: (next) => {
      if (quiet || !planted) return;
      track("leafy_lesson_celebrated");
      setCelebration(next);
    },
    cheer: (message) => {
      if (!quiet && planted) setCheering(message);
    },
    popping: pops > 0,
    registerPop,
  };

  return (
    <CompanionContext.Provider value={value}>
      {children}
      <CompanionResident />
      <LessonCelebration
        celebration={celebration}
        stage={stage}
        growth={growth}
        toNextStage={toNextStage}
        onClose={() => setCelebration(null)}
      />
      <LiveHeadsUp nudges={nudges} growth={growth} muted={quiet || !planted} />
      {cheering !== null && (
        <Pop
          saying={{ message: cheering, mood: "proud" }}
          growth={growth}
          leaving={cheerPop.leaving}
          onDismiss={() => cheerPop.dismiss()}
        />
      )}
      <LeafyIntro
        open={ready && !planted}
        growth={growth}
        onDone={() => {
          // Meeting Leafy is enough for one day; the first pop-up waits for tomorrow.
          setPlanted("1");
          setPopped(dayKey());
        }}
      />
    </CompanionContext.Provider>
  );
}

/**
 * The dashboard greeting with the companion beside it. Its line replaces the
 * subtitle once the student's work has loaded. On the first visit of the day
 * the companion pops up from the bottom first, then settles here.
 */
export function CompanionGreeting({
  heading,
  subtitle,
}: {
  heading: ReactNode;
  subtitle: string;
}) {
  const { nudges, ready, growth, quiet, planted, plantedKnown } = useCompanion();
  const [popped, setPopped] = useStored(POPPED_KEY);
  const [skips, setSkips] = useStored(SKIPS_KEY);
  const [heard, setHeard] = useStored(LIVE_HEARD_KEY);
  const acted = useRef(false);
  const [top] = nudges;
  const kind = nudgeKind(top);

  const today = dayKey();
  const skipped = Number(skips) || 0;
  const popping =
    ready && planted && !quiet && skipped < MAX_SKIPS && popped !== today;
  // Ignored or waved away counts towards backing off; taking the action clears it.
  const pop = useTimedPop(popping, POP_MS, (timedOut) => {
    setPopped(today);
    // A class the daily pop-up already mentioned doesn't get a second heads-up.
    if (kind.startsWith("live-")) setHeard([...(heard?.split("\n") ?? []).slice(-20), top.id].join("\n"));
    if (acted.current) {
      track(`leafy_pop_acted:${kind}`);
      setSkips("0");
      return;
    }
    track(`leafy_pop_${timedOut ? "ignored" : "dismissed"}:${kind}`);
    if (skipped + 1 >= MAX_SKIPS) track("leafy_pop_paused");
    setSkips(String(skipped + 1));
  });
  useEffect(() => {
    if (popping) track(`leafy_pop_shown:${kind}`);
  }, [popping, kind]);

  const settled = ready && planted && !popping;
  const rest = atRest(top.mood);

  // Until `planted` is known, Leafy's place is held so the greeting doesn't jump.
  if (plantedKnown && !planted) {
    return (
      <div>
        {heading}
        <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3">
      <div className={cn("shrink-0", (popping || !planted) && "invisible")}>
        <InteractiveMascot
          key={settled ? "settled" : "waiting"}
          growth={growth}
          mood={settled ? rest.mood : "happy"}
          scene={settled ? rest.scene : undefined}
          palette={TEAL_PALETTE}
          size={104}
          className={cn("-mb-3", settled && styles.settle)}
          label="Leafy, your learning companion. Tap to say hi."
        />
      </div>
      <div className="min-w-0 pb-1">
        {heading}
        {settled ? (
          <div
            className={cn(
              "mt-2 inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl rounded-bl-sm border border-neutral-200 bg-white px-4 py-2.5 shadow-sm",
              styles.settle,
            )}
          >
            <p className="text-sm text-neutral-700">{top.message}</p>
            <SayingAction
              saying={top}
              onClick={() => track(`leafy_greeting_acted:${kind}`)}
            />
          </div>
        ) : (
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        )}
      </div>
      {popping && (
        <Pop
          saying={top}
          growth={growth}
          leaving={pop.leaving}
          onDismiss={() => pop.dismiss()}
          onAct={() => {
            acted.current = true;
            pop.dismiss();
          }}
        />
      )}
    </div>
  );
}

/**
 * Wraps the card the companion's top nudge is about. While that nudge leads,
 * the companion peeks over the card's top edge and looks down at it.
 */
export function CompanionPeek({
  target,
  label,
  className,
  children,
}: {
  target: NonNullable<Nudge["target"]>;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const { nudges, ready, growth, quiet, planted } = useCompanion();
  const pointing = ready && planted && !quiet && nudges[0].target === target;

  return (
    <div className={cn("relative flex flex-col", className)}>
      {pointing && (
        <div className="pointer-events-none absolute right-6 bottom-full flex items-end gap-2">
          <p className="mb-2 rounded-xl rounded-br-sm border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm">
            {label}
          </p>
          {/* The pot stays tucked behind the card. */}
          <div className={cn("-mb-8", styles.peekIn)} aria-hidden>
            <Mascot
              growth={growth}
              mood="worried"
              look={{ x: -0.6, y: 1 }}
              palette={TEAL_PALETTE}
              size={72}
              label=""
            />
          </div>
        </div>
      )}
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}

const popupClass =
  "w-80 origin-[var(--transform-origin)] rounded-3xl border border-neutral-100 bg-white p-3 shadow-[0_8px_24px_rgba(16,24,40,0.08)] outline-none transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0";

/*
 * The companion floating on every student page. It starts in the bottom-right
 * corner; once its panel is closed it slides to the middle of the right edge
 * and rests half out of sight, ready to be tapped back out. A dot marks
 * pressing things it hasn't shown yet; opening it lists what matters today.
 */
export function CompanionResident() {
  const { nudges, ready, stage, growth, toNextStage, quiet, setQuiet, planted, popping } =
    useCompanion();
  const [seen, setSeen] = useStored(SEEN_KEY);
  const [skips, setSkips] = useStored(SKIPS_KEY);
  const [storedTucked, setTucked] = useStored(TUCKED_KEY);
  const [open, setOpen] = useState(false);
  const [tuckToast, setTuckToast] = useState(false);
  const hideToast = useCallback(() => setTuckToast(false), []);
  const tucked = storedTucked === "1";
  const popsPaused = !quiet && (Number(skips) || 0) >= MAX_SKIPS;
  const today = nudges.slice(0, 3);
  const rest = atRest(today[0].mood);
  const urgent = nudges.filter((nudge) => nudge.urgent).map((nudge) => nudge.id);
  const seenIds = seen ? seen.split("\n") : [];
  const hasNews = ready && urgent.some((id) => !seenIds.includes(id));

  if (!planted) return null;

  /* Resting: half hidden on the right edge. Out: in the corner, or beside the edge while open. */
  const resting = tucked && !open;
  /* A daily pop-up brings its own Leafy up from the corner, so this one steps aside. */
  const makingRoom = popping && !tucked;

  return (
    <>
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            track("leafy_opened");
            setSeen(urgent.join("\n"));
            setTuckToast(false);
            return;
          }
          track("leafy_tucked");
          setTucked("1");
          setTuckToast(true);
        }}
      >
        <div
          className={cn(
            "fixed z-40 transition-[top,right,translate,rotate,opacity,scale] duration-700 ease-[cubic-bezier(0.34,1.3,0.64,1)] motion-reduce:transition-none",
            tucked ? "top-[calc(50dvh-1.75rem)]" : "top-[calc(100dvh-5rem)]",
            resting
              ? "right-0 translate-x-1/2 -rotate-12 hover:translate-x-1/4 focus-within:translate-x-1/4"
              : "right-4 sm:right-6",
            makingRoom && "pointer-events-none scale-75 opacity-0",
          )}
        >
          <Popover.Trigger
            aria-label={
              hasNews
                ? "Leafy has something for you"
                : resting
                  ? "Bring Leafy back"
                  : "Open Leafy, your learning companion"
            }
            className="relative flex h-14 w-14 cursor-pointer items-end justify-center overflow-hidden rounded-full border-2 border-white bg-brand-100 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            {/* Keyed on where Leafy is going, so it hops each time it moves. */}
            <span key={resting ? "resting" : "out"} aria-hidden className={styles.tuckHop}>
              <Mascot
                growth={growth}
                palette={TEAL_PALETTE}
                size={52}
                closeUp
                animated={false}
                label=""
              />
            </span>
            {hasNews && (
              <span className="absolute top-1 right-2 h-3 w-3 rounded-full border-2 border-white bg-text-error" />
            )}
          </Popover.Trigger>
        </div>
        <Popover.Portal>
          <Popover.Positioner
            side={tucked ? "left" : "top"}
            align={tucked ? "center" : "end"}
            sideOffset={12}
            className="z-50"
          >
            <Popover.Popup className={popupClass}>
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3">
                <InteractiveMascot
                  growth={growth}
                  mood={ready ? rest.mood : "thinking"}
                  scene={ready ? rest.scene : undefined}
                  palette={TEAL_PALETTE}
                  size={72}
                  className="-my-2 shrink-0"
                  label="Leafy. Tap to say hi."
                />
                <div className="min-w-0 flex-1">
                  <Popover.Title className="text-sm font-semibold text-neutral-800">
                    Leafy
                  </Popover.Title>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">{ambientLife().status}</p>
                  {(toNextStage > 0 || stage === BLOOM) && (
                    <p className="mt-0.5 truncate text-xs text-neutral-400">
                      {growthLine(stage, toNextStage)}
                    </p>
                  )}
                </div>
                <Popover.Close
                  aria-label="Close"
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  <X className="h-4 w-4" />
                </Popover.Close>
              </div>

              <p className="px-3 pt-4 pb-1 text-xs font-medium text-neutral-400">Today</p>
              {ready ? (
                <ul>
                  {today.map((nudge) => (
                    <li key={nudge.id} className="flex items-center gap-3 px-3 py-2.5">
                      <p className="min-w-0 flex-1 text-sm text-neutral-700">{nudge.message}</p>
                      <SayingAction
                        saying={nudge}
                        onClick={() => track(`leafy_today_acted:${nudgeKind(nudge)}`)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-2.5 text-sm text-neutral-400">Checking your week…</p>
              )}

              {popsPaused && (
                <div className="mx-3 mt-2 flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5">
                  <p className="min-w-0 flex-1 text-xs text-neutral-500">
                    I stopped popping up on your dashboard since you kept passing.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      track("leafy_pop_resumed");
                      setSkips("0");
                    }}
                    className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
                  >
                    Bring back
                  </button>
                </div>
              )}

              <button
                type="button"
                aria-pressed={quiet}
                onClick={() => setQuiet(!quiet)}
                className="mt-2 flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100"
              >
                {quiet ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                {quiet ? "Quiet mode is on" : "Turn on quiet mode"}
              </button>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {tuckToast && (
        <SuccessToast
          title="Leafy is resting"
          message="Leafy is tucked on the right edge of your screen. Tap it whenever you want it back."
          onDismiss={hideToast}
        />
      )}
    </>
  );
}
