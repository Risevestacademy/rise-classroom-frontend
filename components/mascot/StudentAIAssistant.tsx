"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Send, X } from "lucide-react";
import { InteractiveMascot } from "./InteractiveMascot";
import { TEAL_PALETTE, type MascotMood } from "./Mascot";

type StudentAssistantContextValue = {
  openAssistant: () => void;
};

const StudentAssistantContext = createContext<StudentAssistantContextValue | null>(
  null,
);

export function useStudentAIAssistant() {
  const context = useContext(StudentAssistantContext);
  if (!context) {
    throw new Error("useStudentAIAssistant must be used within StudentAIAssistantProvider");
  }
  return context;
}

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

function StudentAIAssistant({
  isOpen,
  onOpen,
  onClose,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [draft, setDraft] = useState("");
  const [isThinking] = useState(false);
  const titleId = useId();
  const mood = useMascotMood(isThinking);
  const showLauncher = pathname !== "/student/dashboard" && !isFocusPage(pathname);

  return (
    <div className="fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6">
      {isOpen && (
        <section
          role="dialog"
          aria-labelledby={titleId}
          className="mb-3 flex h-[min(580px,calc(100dvh-7.5rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
        >
          <header className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
            <InteractiveMascot
              stage={3}
              mood={mood}
              palette={TEAL_PALETTE}
              size={54}
              className="-my-2 shrink-0"
              label="Rise learning companion. Tap to say hi."
            />
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-sm font-semibold text-neutral-800">
                Rise companion
              </h2>
              <p className="mt-0.5 text-xs text-neutral-400">
                Here when you need help
              </p>
            </div>
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
              Hi. I&apos;m here to help you keep moving forward. What would you like to work through?
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {["Explain this lesson", "Help me plan my work", "What should I do next?"].map(
                (prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setDraft(prompt)}
                    className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-border-focus"
                  >
                    {prompt}
                  </button>
                ),
              )}
            </div>
          </div>

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
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary text-white transition-colors hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-border-focus"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}

      {showLauncher && !isOpen && (
        <InteractiveMascot
          stage={3}
          mood={mood}
          palette={TEAL_PALETTE}
          size={96}
          onPoke={onOpen}
          className="-mb-5"
          label="Open Rise AI companion"
        />
      )}
    </div>
  );
}

export function StudentAIAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openAssistant = useCallback(() => setIsOpen(true), []);
  const closeAssistant = useCallback(() => setIsOpen(false), []);

  return (
    <StudentAssistantContext.Provider value={{ openAssistant }}>
      {children}
      <StudentAIAssistant
        isOpen={isOpen}
        onOpen={openAssistant}
        onClose={closeAssistant}
      />
    </StudentAssistantContext.Provider>
  );
}
