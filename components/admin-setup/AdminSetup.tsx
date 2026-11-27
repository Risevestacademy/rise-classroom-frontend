"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { InformationCircle } from "@/assets/icons";
import { useSidebarNav } from "@/components/SidebarNavContext";
import { Spotlight } from "@/components/tour/Spotlight";
import { Button } from "@/components/ui/button";
import { adminQueries } from "@/lib/admin";
import {
  currentItem,
  guideStep,
  setupItems,
  type GuideAction,
  type SetupItem,
  type SetupProgress,
} from "@/lib/admin-setup";
import { track } from "@/lib/analytics/track";
import { sessionQuery } from "@/lib/session-query";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- storage */

const storageEvent = "admin-setup-storage";

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(storageEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(storageEvent, onChange);
  };
}

/* A value kept in local or session storage, shared by every component that reads it. */
function useStored(kind: "local" | "session", key: string | null) {
  const read = () => {
    if (!key) return null;
    try {
      return (kind === "local" ? localStorage : sessionStorage).getItem(key);
    } catch {
      return null;
    }
  };
  const value = React.useSyncExternalStore(subscribeToStorage, read, () => null);
  const write = React.useCallback(
    (next: string | null) => {
      if (!key) return;
      try {
        const storage = kind === "local" ? localStorage : sessionStorage;
        if (next === null) storage.removeItem(key);
        else storage.setItem(key, next);
      } catch {
        /* Without storage the guide just offers itself again next visit. */
      }
      window.dispatchEvent(new Event(storageEvent));
    },
    [kind, key],
  );
  return [value, write] as const;
}

/* Whether one of the app's own dialogs is open. The guide steps aside for it,
   and explains the dialog from inside instead. */
function subscribeToDialogs(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

function useDialogOpen() {
  return React.useSyncExternalStore(
    subscribeToDialogs,
    () => Boolean(document.querySelector('[role="dialog"]:not([data-tour-card])')),
    () => false,
  );
}

/* ---------------------------------------------------------------- context */

type AdminSetupValue = {
  /** The academy has no students yet and the admin hasn't skipped the guide. */
  checklistVisible: boolean;
  progress: SetupProgress;
  guiding: boolean;
  start: () => void;
  skip: () => void;
};

const AdminSetupContext = React.createContext<AdminSetupValue | null>(null);

/**
 * The one-time setup guide for a new academy. It's offered on the dashboard
 * until the first student is invited, then never again. Progress is read from
 * the academy's data, so steps done without the guide count too.
 */
export function AdminSetupProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userId = useQuery(sessionQuery()).data?.user.id ?? null;
  const [status, setStatus] = useStored("local", userId && `admin-setup:${userId}`);
  const [guide, setGuide] = useStored("session", userId && `admin-setup-guide:${userId}`);
  const active = Boolean(userId) && status === null;

  const cohorts = useQuery({ ...adminQueries.cohorts(), enabled: active });
  const tracks = useQuery({ ...adminQueries.tracks(), enabled: active });
  const students = useQuery({
    ...adminQueries.userCount({ role: "STUDENT" }),
    enabled: active,
  });
  const loaded = cohorts.isSuccess && tracks.isSuccess && students.isSuccess;
  const progress: SetupProgress = {
    cohort: (cohorts.data?.length ?? 0) > 0,
    track: (tracks.data?.length ?? 0) > 0,
    student: (students.data ?? 0) > 0,
  };
  const guiding = active && loaded && guide === "1";

  // An academy that got its first student without the guide doesn't need it.
  const settledWithoutGuide = active && loaded && progress.student && !guiding;
  React.useEffect(() => {
    if (settledWithoutGuide) setStatus("done");
  }, [settledWithoutGuide, setStatus]);

  const [form, setForm] = React.useState({ path: "", step: 0 });
  const formStep = form.path === pathname ? form.step : 0;
  const [trackNoteRead, setTrackNoteRead] = React.useState(false);
  const [cohortPickerRead, setCohortPickerRead] = React.useState(false);
  const [teamStep, setTeamStep] = React.useState(0);
  const dialogOpen = useDialogOpen();

  const step = guiding
    ? guideStep(pathname, progress, { formStep, trackNoteRead, cohortPickerRead, teamStep })
    : null;

  /* On small screens the sidebar is a closed menu, so it's opened for a step
     that points at one of its links. */
  const { setOpen: setSidebarOpen } = useSidebarNav();
  const sidebarStep = Boolean(step?.target.startsWith("nav:")) && !dialogOpen;
  React.useEffect(() => {
    if (sidebarStep && window.matchMedia("(max-width: 1023px)").matches) {
      setSidebarOpen(true);
    }
  }, [sidebarStep, step?.target, setSidebarOpen]);

  const act = (action: GuideAction) => {
    if (action === "form-next") setForm({ path: pathname, step: formStep + 1 });
    else if (action === "form-back") setForm({ path: pathname, step: Math.max(0, formStep - 1) });
    else if (action === "track-note-read") setTrackNoteRead(true);
    else if (action === "picker-read") setCohortPickerRead(true);
    else if (action === "team-next") setTeamStep(1);
    else if (action === "team-back") setTeamStep(0);
    else {
      track("admin_setup_finished");
      setStatus("done");
      setGuide(null);
    }
  };

  const value: AdminSetupValue = {
    checklistVisible: active && loaded && !progress.student,
    progress,
    guiding,
    start: () => {
      track("admin_setup_started");
      setGuide("1");
    },
    skip: () => {
      track("admin_setup_skipped");
      setStatus("dismissed");
      setGuide(null);
    },
  };

  return (
    <AdminSetupContext.Provider value={value}>
      {children}
      {step && !dialogOpen && (
        <Spotlight
          target={step.target}
          title={step.title}
          body={step.body}
          index={setupItems.indexOf(step.item)}
          count={setupItems.length}
          interactive={step.interactive}
          onClose={() => {
            track("admin_setup_paused");
            setGuide(null);
          }}
          onNext={step.next && (() => act(step.next!.action))}
          onBack={step.back && (() => act(step.back!))}
          nextLabel={step.next?.label}
        />
      )}
    </AdminSetupContext.Provider>
  );
}

/* --------------------------------------------------------------- checklist */

const checklist: Record<SetupItem, { title: string; description: string }> = {
  cohort: {
    title: "Create a cohort",
    description: "A group of students who learn together over the same dates.",
  },
  track: {
    title: "Create your tracks",
    description: "What students learn, like Product Design. Add one for each programme you run.",
  },
  student: {
    title: "Invite your first student",
    description: "Start with one. You'll choose their cohort and track.",
  },
  team: {
    title: "Find your instructors and mentors",
    description: "See where to invite the people who teach and guide your students.",
  },
};

/** The dashboard card that offers the guide, with what's done so far. */
export function AdminSetupChecklist({ fallback }: { fallback?: React.ReactNode }) {
  const setup = React.useContext(AdminSetupContext);
  if (!setup?.checklistVisible) return <>{fallback}</>;

  const { progress } = setup;
  const current = currentItem(progress);
  const done = (item: SetupItem) => item !== "team" && progress[item];
  const started = progress.cohort || setup.guiding;

  return (
    <section
      aria-labelledby="admin-setup-title"
      className="rounded-xl bg-surface-default p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.15)]"
    >
      <h2 id="admin-setup-title" className="text-lg font-semibold text-text-primary">
        Set up your academy
      </h2>
      <p className="mt-1 font-work text-sm text-text-secondary">
        A few steps to get your first student learning. We&apos;ll show you where everything is.
      </p>

      <ol className="mt-5 flex flex-col gap-4">
        {setupItems.map((item, index) => {
          const complete = done(item);
          const isCurrent = item === current;
          return (
            <li key={item} className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  complete && "bg-surface-success-badge text-text-success",
                  !complete && isCurrent && "bg-brand-primary text-white",
                  !complete && !isCurrent && "bg-neutral-100 text-neutral-400",
                )}
              >
                {complete ? <Check className="size-4" aria-label="Done" /> : index + 1}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    complete || isCurrent ? "text-text-primary" : "text-neutral-400",
                    complete && "line-through decoration-neutral-300",
                  )}
                >
                  {checklist[item].title}
                </p>
                <p className="mt-0.5 font-work text-xs text-text-secondary">
                  {checklist[item].description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button size="medium" onClick={setup.start}>
          {started ? "Continue setup" : "Start setup"}
        </Button>
        <Button variant="tertiary" size="medium" onClick={setup.skip}>
          Skip the guide
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- hints */

/**
 * A tip shown inside a dialog while the guide is on that task, in place of
 * the spotlight, which can't sit over a dialog.
 */
export function SetupHint({
  item,
  children,
}: {
  item: SetupItem;
  children: React.ReactNode;
}) {
  const setup = React.useContext(AdminSetupContext);
  if (!setup?.guiding || currentItem(setup.progress) !== item) return null;

  return (
    <p className="mt-4 flex items-start gap-3 rounded-xl bg-brand-50 p-4 font-work text-[13px] leading-[18px] text-text-secondary">
      <InformationCircle className="size-5 shrink-0 text-text-primary" />
      <span>{children}</span>
    </p>
  );
}
