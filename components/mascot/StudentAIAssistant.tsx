"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BellOff, Bell, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { studentQueries } from "@/lib/student";
import { InteractiveMascot } from "./InteractiveMascot";
import { Mascot, TEAL_PALETTE, type MascotMood } from "./Mascot";
import { stageFromLessons, type MascotStage } from "./growth";

/** What the student is looking at when they ask, so the companion can focus on it. */
export type AssistantTopic = { kind: "lesson" | "assignment"; title: string };

type StudentAssistantContextValue = {
  openAssistant: (topic?: AssistantTopic) => void;
  /** Celebrates something the student just did. Skipped in quiet mode and after the first per session. */
  cheer: (message: string) => void;
  stage: MascotStage;
};

const StudentAssistantContext =
  createContext<StudentAssistantContextValue | null>(null);

export function useStudentAIAssistant() {
  const context = useContext(StudentAssistantContext);
  if (!context) {
    throw new Error(
      "useStudentAIAssistant must be used within StudentAIAssistantProvider",
    );
  }
  return context;
}

const CHEER_MS = 6000;
const QUIET_KEY = "rise-companion-quiet";
const CHEERED_KEY = "rise-companion-cheered";

const quietListeners = new Set<() => void>();
function subscribeQuiet(listener: () => void) {
  quietListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    quietListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function useQuietMode() {
  const quiet = useSyncExternalStore(
    subscribeQuiet,
    () => localStorage.getItem(QUIET_KEY) === "1",
    () => false,
  );
  const setQuiet = useCallback((value: boolean) => {
    localStorage.setItem(QUIET_KEY, value ? "1" : "0");
    quietListeners.forEach((listener) => listener());
  }, []);
  return [quiet, setQuiet] as const;
}

/** Lesson and assignment pages offer "Ask Rise" in the page itself instead of the launcher. */
function isFocusPage(pathname: string) {
  return (
    /^\/student\/my-learning\/lesson\//.test(pathname) ||
    /^\/student\/assignments\/[^/]+$/.test(pathname)
  );
}

function useMascotMood(isThinking: boolean): MascotMood {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const updateHour = () => setHour(new Date().getHours());
    const interval = window.setInterval(updateHour, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  if (isThinking) return "thinking";
  return hour >= 21 || hour < 6 ? "sleepy" : "happy";
}

function useMascotStage(): MascotStage {
  const progress = useQuery(studentQueries.progress());
  const enrollment =
    progress.data?.find((item) => !item.trackComplete) ?? progress.data?.[0];
  return enrollment
    ? stageFromLessons(
        enrollment.progress.completedLessons,
        enrollment.progress.totalLessons,
      )
    : 0;
}

const prompts: Record<AssistantTopic["kind"] | "general", string[]> = {
  general: [
    "What should I do next?",
    "Help me plan my week",
    "Explain something from a lesson",
  ],
  lesson: [
    "Explain this lesson simply",
    "Summarise the key points",
    "Quiz me on this lesson",
  ],
  assignment: [
    "Help me understand the brief",
    "Give me a hint to get started",
    "Check my approach",
  ],
};

const greetings: Record<AssistantTopic["kind"] | "general", string> = {
  general:
    "Hi. I'm here to help you keep moving forward. What would you like to work through?",
  lesson: "Want to go over this lesson together? Ask me anything about it.",
  assignment:
    "I can help you think this one through. I'll give hints and questions, not the answers.",
};

function AssistantPanel({
  topic,
  stage,
  mood,
  quiet,
  onQuietChange,
  onClose,
}: {
  topic: AssistantTopic | undefined;
  stage: MascotStage;
  mood: MascotMood;
  quiet: boolean;
  onQuietChange: (value: boolean) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const titleId = useId();
  const kind = topic?.kind ?? "general";

  return (
    <aside
      aria-labelledby={titleId}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-2xl border border-neutral-200 bg-white shadow-xl",
        "sm:inset-x-auto sm:right-6 sm:bottom-6 sm:h-[min(580px,calc(100dvh-3rem))] sm:w-96 sm:rounded-2xl",
        "lg:top-0 lg:right-0 lg:bottom-auto lg:h-dvh lg:rounded-none lg:border-y-0 lg:border-r-0",
        "2xl:sticky 2xl:z-auto 2xl:shrink-0 2xl:self-start 2xl:shadow-none",
      )}
    >
      <header className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
        <InteractiveMascot
          stage={stage}
          mood={mood}
          palette={TEAL_PALETTE}
          size={44}
          className="-my-2 shrink-0"
          label="Rise learning companion. Tap to say hi."
        />
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-sm font-semibold text-neutral-800">
            Rise companion
          </h2>
          <p className="mt-0.5 truncate text-xs text-neutral-400">
            {topic ? topic.title : "Here when you need help"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onQuietChange(!quiet)}
          aria-pressed={quiet}
          title={
            quiet
              ? "Quiet mode is on: I only speak when you ask"
              : "Turn on quiet mode"
          }
          aria-label="Quiet mode"
          className="text-neutral-400 transition-colors hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          {quiet ? (
            <BellOff className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Rise companion"
          className="text-neutral-400 transition-colors hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-neutral-50 p-5">
        <p className="max-w-[86%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-6 text-neutral-600 shadow-sm">
          {greetings[kind]}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {prompts[kind].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setDraft(prompt)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-border-focus"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* PENDING-BACKEND: no assistant endpoint yet, so messages aren't sent. */}
      <form
        className="flex items-center gap-2 border-t border-neutral-200 p-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="sr-only" htmlFor="rise-ai-message">
          Ask the Rise companion
        </label>
        <input
          id="rise-ai-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask a question"
          className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-border-focus focus:ring-2 focus:ring-border-focus/20"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send message"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary text-white transition-colors hover:bg-brand-900 focus-visible:ring-2 focus-visible:ring-border-focus disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}

/** The small companion in the corner, plus the speech bubble when it has something to say. */
function Corner({
  stage,
  mood,
  message,
  showLauncher,
  onOpen,
  onDismiss,
}: {
  stage: MascotStage;
  mood: MascotMood;
  message: string | null;
  showLauncher: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  if (!message && !showLauncher) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-0 z-40 flex items-end gap-2 sm:right-6">
      {message && (
        <div
          role="status"
          className="pointer-events-auto mb-10 flex max-w-64 items-start gap-2 rounded-2xl rounded-br-sm border border-neutral-200 bg-white py-3 pr-2 pl-4 text-sm text-neutral-700 shadow-lg"
        >
          <button type="button" onClick={onOpen} className="text-left">
            {message}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="shrink-0 text-neutral-400 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* Sits half below the screen edge so it covers as little of the page as possible. */}
      <InteractiveMascot
        stage={stage}
        mood={message ? "celebrate" : mood}
        palette={TEAL_PALETTE}
        size={56}
        onPoke={onOpen}
        className="pointer-events-auto translate-y-4 transition-transform hover:translate-y-0 focus-visible:translate-y-0"
        label="Open Rise AI companion"
      />
    </div>
  );
}

/** "Ask Rise" for lesson and assignment pages, where the corner companion stays out of the way. */
export function AskRiseButton({
  topic,
  className,
}: {
  topic: AssistantTopic;
  className?: string;
}) {
  const { openAssistant, stage } = useStudentAIAssistant();
  return (
    <button
      type="button"
      onClick={() => openAssistant(topic)}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white pr-3 pl-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-border-focus",
        className,
      )}
    >
      <span aria-hidden>
        <Mascot
          stage={stage}
          palette={TEAL_PALETTE}
          size={20}
          animated={false}
        />
      </span>
      Ask Rise
    </button>
  );
}

export function StudentAIAssistantProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState<AssistantTopic>();
  const [message, setMessage] = useState<string | null>(null);
  const [quiet, setQuiet] = useQuietMode();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stage = useMascotStage();
  const mood = useMascotMood(false);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setMessage(null);
  }, []);

  const openAssistant = useCallback(
    (next?: AssistantTopic) => {
      dismiss();
      setTopic(next);
      setIsOpen(true);
    },
    [dismiss],
  );

  const cheer = useCallback(
    (text: string) => {
      if (isOpen || quiet || sessionStorage.getItem(CHEERED_KEY)) return;
      sessionStorage.setItem(CHEERED_KEY, "1");
      setMessage(text);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), CHEER_MS);
    },
    [isOpen, quiet],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const value = useMemo(
    () => ({ openAssistant, cheer, stage }),
    [openAssistant, cheer, stage],
  );

  // The dashboard has its own companion card.
  const showLauncher =
    !isOpen && pathname !== "/student/dashboard" && !isFocusPage(pathname);

  return (
    <StudentAssistantContext.Provider value={value}>
      <div className="flex min-h-screen w-full">
        <div className="min-w-0 flex-1">{children}</div>
        {isOpen && (
          <AssistantPanel
            topic={topic}
            stage={stage}
            mood={mood}
            quiet={quiet}
            onQuietChange={setQuiet}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
      {!isOpen && (
        <Corner
          stage={stage}
          mood={mood}
          message={message}
          showLauncher={showLauncher}
          onOpen={() => openAssistant()}
          onDismiss={dismiss}
        />
      )}
    </StudentAssistantContext.Provider>
  );
}
