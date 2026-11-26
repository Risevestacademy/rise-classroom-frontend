import { useSyncExternalStore } from "react";
import Image from "next/image";
import {
  Calendar,
  Check,
  ChevronRight,
  CirclePlay,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Radar,
  UploadCloud,
} from "lucide-react";

import { MASCOT_STAGES } from "@/components/mascot/growth";
import { Mascot, TEAL_PALETTE } from "@/components/mascot/Mascot";
import styles from "@/components/mascot/mascot.module.css";
import { cn } from "@/lib/utils";

import type { Director } from "../director";
import { Card, DemoDialog, ProgressBar, Shell, usePhone } from "../kit";

const NAV = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
  { id: "learning", title: "My learning", icon: GraduationCap },
  { id: "assignments", title: "Assignments", icon: ClipboardList },
  { id: "tower", title: "Control tower", icon: Radar },
];

const CRUMBS = [
  { id: "dashboard", parts: ["Dashboard"] },
  { id: "learning", parts: ["My learning", "User Research"] },
  { id: "assignments", parts: ["Assignments", "Persona deck"] },
];

const LESSONS = [
  { title: "Planning user interviews", length: "12 min", state: "done" },
  { title: "Building personas", length: "18 min", state: "current" },
  { title: "Mapping the user journey", length: "15 min", state: "locked" },
] as const;

/** Leafy grows from Sprout to Lush in one lesson: half the plant's growth. */
const GROWTH_FROM = 1.1;
const GROWTH_TO = 4.05;

function createGrowth() {
  let value = GROWTH_FROM;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: number) {
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
const growth = createGrowth();

function DashboardScene() {
  const phone = usePhone();
  return (
    <div data-scene="dashboard" className={cn("absolute inset-0", phone ? "px-5" : "px-8 pb-8")}>
      <h3 className="text-2xl font-bold text-neutral-800">Good morning, Ada</h3>
      <p className="mt-1 text-sm text-neutral-400">
        You&apos;re 2 lessons away from finishing this module.
      </p>

      <div className={cn("mt-6 grid gap-5", phone ? "mt-5 gap-4" : "grid-cols-[1.6fr_1fr]")}>
        <Card className={cn("flex", phone ? "flex-col gap-4 p-4" : "gap-5 p-5")}>
          <Image
            src="/module-header.png"
            alt=""
            width={372}
            height={192}
            className={cn("shrink-0 rounded-xl object-cover", phone ? "h-32 w-full" : "h-36 w-56")}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-xs font-medium tracking-wider text-neutral-400 uppercase">
              Continue learning
            </p>
            <p className="mt-1 text-lg font-bold text-neutral-800">
              02. User Research and Analysis
            </p>
            <p className="mt-1 text-sm text-neutral-500">Next: Building personas</p>
            <div className={cn("mt-auto flex items-center gap-4", phone && "mt-4")}>
              <span
                data-demo="continue"
                className="flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-medium text-white"
              >
                Continue
              </span>
              <span className="text-xs text-neutral-400">18 min</span>
            </div>
          </div>
        </Card>

        <Card data-demo="track-card" className="p-5">
          <p className="text-xs font-medium tracking-wider text-neutral-400 uppercase">
            Design track
          </p>
          <p className="mt-2 text-3xl font-bold text-neutral-800">
            <span data-demo="track-percent">40</span>%
          </p>
          <p className="mb-4 text-sm text-neutral-500">of the track complete</p>
          <ProgressBar value={40} id="track-bar" />
          <div className="mt-4 flex justify-between text-xs text-neutral-400">
            <span>
              <span data-demo="track-lessons">16</span> of 40 lessons
            </span>
            <span>
              <span data-demo="track-assignments">4</span> of 12 assignments
            </span>
          </div>
        </Card>
      </div>

      <div className={cn("mt-5 grid grid-cols-3 gap-5", phone && "hidden")}>
        {[
          ["Persona deck", "Due Friday", ClipboardList],
          ["Live: Research synthesis", "Thursday, 4pm", Calendar],
          ["Weekly check-in", "Control tower", Radar],
        ].map(([title, meta, Icon]) => {
          const I = Icon as typeof Calendar;
          return (
            <Card key={title as string} className="flex items-center gap-3 p-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-surface-brand text-brand-primary">
                <I className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-neutral-800">{title as string}</p>
                <p className="text-xs text-neutral-400">{meta as string}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ModuleScene() {
  const phone = usePhone();
  return (
    <div data-scene="module" className={cn("absolute inset-0 opacity-0", phone ? "px-5" : "px-8 pb-8")}>
      <Image
        src="/curriculum-header.png"
        alt=""
        width={1136}
        height={190}
        className={cn("w-full rounded-2xl object-cover", phone ? "h-24" : "h-28")}
      />
      <div className={cn("mt-5 flex gap-3", phone ? "flex-col items-start gap-2" : "items-center")}>
        <h3 className={cn("font-bold text-neutral-800", phone ? "text-xl" : "text-2xl")}>
          02. User Research and Analysis
        </h3>
        <span className="rounded-full bg-surface-success-badge px-2 py-0.5 text-xs font-medium text-green-700">
          In progress
        </span>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Learn how to talk to users and turn what you hear into design decisions.
      </p>

      <Card className="mt-5 divide-y divide-neutral-200">
        {LESSONS.map((lesson, index) => (
          <div
            key={lesson.title}
            data-demo={`lesson-${index + 1}`}
            className={cn("flex items-center gap-4 py-4", phone ? "px-4" : "px-5")}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-medium",
                lesson.state === "done" && "bg-green-100 text-green-700",
                lesson.state === "current" && "bg-brand-primary text-white",
                lesson.state === "locked" && "bg-neutral-100 text-neutral-400",
              )}
            >
              {lesson.state === "done" ? <Check className="size-4" /> : index + 1}
            </span>
            <div className="flex-1">
              <p
                data-demo={`lesson-${index + 1}-title`}
                className="w-fit text-sm font-medium text-neutral-800"
              >
                {lesson.title}
              </p>
              <p className="text-xs text-neutral-400">Lesson · {lesson.length}</p>
            </div>
            {lesson.state === "locked" ? (
              <Lock className="size-4 text-neutral-400" />
            ) : (
              <ChevronRight className="size-4 text-neutral-400" />
            )}
          </div>
        ))}
        <div className="flex items-center gap-4 px-5 py-4">
          <span className="flex size-8 items-center justify-center rounded-full bg-surface-warning-badge text-amber-700">
            <ClipboardList className="size-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-800">Persona deck</p>
            <p className="text-xs text-neutral-400">Assignment · Due Friday</p>
          </div>
          <ChevronRight className="size-4 text-neutral-400" />
        </div>
      </Card>
    </div>
  );
}

function LessonScene() {
  const phone = usePhone();
  return (
    <div
      data-scene="lesson"
      className={cn(
        "absolute inset-0 opacity-0",
        phone ? "flex flex-col gap-4 px-5" : "grid grid-cols-[1fr_280px] gap-5 px-8 pb-8",
      )}
    >
      <div>
        <div className={cn("relative overflow-hidden rounded-2xl", phone ? "h-52" : "h-[390px]")}>
          <Image
            src="/live-class-2.jpg"
            alt=""
            width={835}
            height={545}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-brand-primary/25">
            <CirclePlay className="size-16 text-white" strokeWidth={1.25} />
          </div>
          <div className="absolute inset-x-5 bottom-4 h-1 rounded-full bg-white/40">
            <div data-demo="video-bar" className="h-full w-[62%] rounded-full bg-white" />
          </div>
        </div>
        <div className={cn("mt-5 flex justify-between gap-6", phone ? "mt-4 flex-col gap-3" : "items-start")}>
          <div>
            <h3 className="text-xl font-bold text-neutral-800">Building personas</h3>
            <p className="mt-1 max-w-md text-sm text-neutral-500">
              Turn interview notes into personas your whole team can design for.
            </p>
          </div>
          <span
            data-demo="complete"
            className="relative flex h-10 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-lg border border-brand-primary px-4 text-sm font-medium text-brand-primary"
          >
            <span
              data-demo="complete-fill"
              className="absolute inset-0 origin-left scale-x-0 bg-green-600"
            />
            <Check className="relative size-4" />
            <span className="relative grid">
              <span data-demo="complete-label" className="[grid-area:1/1]">
                Mark as complete
              </span>
              <span
                data-demo="complete-done"
                className="text-white opacity-0 [grid-area:1/1]"
              >
                Completed
              </span>
            </span>
          </span>
        </div>
      </div>

      <Card className="h-fit p-4">
        <p className="mb-3 text-xs font-medium tracking-wider text-neutral-400 uppercase">
          In this module
        </p>
        {LESSONS.map((lesson, index) => (
          <div key={lesson.title} className="flex items-center gap-3 py-2 text-sm">
            <span
              data-demo={index === 1 ? "side-check" : undefined}
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs",
                lesson.state === "done"
                  ? "bg-green-100 text-green-700"
                  : "bg-neutral-100 text-neutral-500",
              )}
            >
              {lesson.state === "done" ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span
              className={
                index === 1 ? "font-medium text-neutral-800" : "text-neutral-500"
              }
            >
              {lesson.title}
            </span>
          </div>
        ))}
        <span
          data-demo="next"
          className="mt-3 flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-primary text-sm font-medium text-white"
        >
          Next: Persona deck
          <ChevronRight className="size-4" />
        </span>
      </Card>
    </div>
  );
}

function AssignmentScene() {
  const phone = usePhone();
  return (
    <div
      data-scene="assignment"
      className={cn(
        "absolute inset-0 opacity-0",
        phone ? "px-5" : "grid grid-cols-[1fr_300px] gap-5 px-8 pb-8",
      )}
    >
      <Card className={phone ? "p-5" : "p-6"}>
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-neutral-800">Persona deck</h3>
          <span className="grid">
            <span
              data-demo="status-from"
              className="w-fit rounded-full bg-surface-warning-badge px-2 py-0.5 text-xs font-medium text-amber-700 [grid-area:1/1]"
            >
              Not submitted
            </span>
            <span
              data-demo="status-to"
              className="w-fit rounded-full bg-surface-success-badge px-2 py-0.5 text-xs font-medium text-green-700 opacity-0 [grid-area:1/1]"
            >
              Submitted
            </span>
          </span>
        </div>
        <p className="mt-2 max-w-lg text-sm text-neutral-500">
          Create two personas from your interview notes. Show their goals, frustrations and
          a quote that sums each of them up.
        </p>

        <div
          data-demo="dropzone"
          className={cn(
            "mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-center",
            phone ? "mt-5 h-40" : "h-52",
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-surface-brand text-brand-primary">
            <UploadCloud className="size-6" />
          </span>
          <p className="mt-3 text-sm font-medium text-neutral-800">
            Drop your file here
          </p>
          <p className="text-xs text-neutral-400">PDF, Figma link or images up to 50MB</p>
        </div>

        <div
          data-demo="upload"
          className="mt-4 flex items-center gap-3 rounded-xl border border-neutral-200 p-3 opacity-0"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <FileText className="size-5" />
          </span>
          <div className="flex-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-neutral-800">persona-deck.pdf</span>
              <span className="text-neutral-400">4.2 MB</span>
            </div>
            <div className="mt-2">
              <ProgressBar value={100} id="upload-bar" />
            </div>
          </div>
        </div>

        <div className={cn("mt-5 flex", phone ? "flex-col" : "justify-end")}>
          <span
            data-demo="submit"
            className="flex h-10 justify-center items-center rounded-lg bg-brand-primary px-5 text-sm font-medium text-white opacity-40"
          >
            Submit assignment
          </span>
        </div>
      </Card>

      <Card className={cn("h-fit space-y-4 p-5 text-sm", phone && "hidden")}>
        {[
          [Clock, "Due", "Friday, 11:59pm"],
          [GraduationCap, "Module", "User Research"],
          [ClipboardList, "Points", "20"],
        ].map(([Icon, label, value]) => {
          const I = Icon as typeof Clock;
          return (
            <div key={label as string} className="flex items-center gap-3">
              <I className="size-4 text-neutral-400" />
              <span className="text-neutral-500">{label as string}</span>
              <span className="ml-auto font-medium text-neutral-800">
                {value as string}
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/** The lesson celebration from the app: Leafy grows in front of the student. */
function GrowthPopup() {
  const shown = useSyncExternalStore(growth.subscribe, growth.get, growth.get);
  const stage = Math.floor(shown);
  const done = shown >= GROWTH_TO - 0.001;
  const title = done ? `Leafy reached the ${MASCOT_STAGES[stage]} stage!` : "Lesson complete";

  return (
    <DemoDialog id="popup" className="w-[340px] text-center">
      <div className="flex flex-col items-center">
        <div data-demo="popup-leafy" className="relative">
          <span
            data-demo="popup-glow"
            className="absolute inset-6 rounded-full bg-brand-100 opacity-0"
          />
          {/* Re-keyed as each stage is crossed, so the new stage lands with a bounce. */}
          <div
            key={stage}
            className={cn("relative", stage > Math.floor(GROWTH_FROM) && styles.stageJump)}
          >
            <Mascot growth={shown} mood="celebrate" palette={TEAL_PALETTE} size={168} label="" />
          </div>
        </div>
        <p
          key={title}
          className={cn("mt-2 text-lg font-bold text-neutral-800", done && styles.settle)}
        >
          {title}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          {done ? "2 lessons to Bud." : "Leafy is growing…"}
        </p>
        <div className="mt-4 flex gap-1.5">
          {MASCOT_STAGES.slice(1).map((name, index) => (
            <span
              key={name}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors duration-300",
                index < stage ? "bg-brand-600" : "bg-neutral-200",
              )}
            />
          ))}
        </div>
        <div className="mt-6 flex w-full flex-col gap-2">
          <span
            data-demo="popup-next"
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-primary text-sm font-medium text-white"
          >
            Next: Persona deck
            <ChevronRight className="size-4" />
          </span>
          <span className="flex h-10 items-center justify-center text-sm font-medium text-neutral-500">
            Stay here
          </span>
        </div>
      </div>
    </DemoDialog>
  );
}

export function StudentApp() {
  return (
    <Shell
      nav={NAV}
      active="dashboard"
      crumbs={CRUMBS}
      user={{ name: "Ada Okafor", meta: "Design track" }}
      corner={
        <span className="flex size-14 items-end justify-center overflow-hidden rounded-full border-2 border-white bg-brand-100 shadow-lg">
          <Mascot closeUp growth={GROWTH_FROM} size={52} palette={TEAL_PALETTE} animated={false} label="" />
        </span>
      }
      file="persona-deck.pdf"
      overlay={<GrowthPopup />}
    >
      <DashboardScene />
      <ModuleScene />
      <LessonScene />
      <AssignmentScene />
    </Shell>
  );
}

export function studentScript(d: Director) {
  const { tl, q, at, camera, move, click, swap, nav } = d;
  const P = Object.fromEntries(
    [
      "continue",
      "lesson-2-title",
      "complete",
      "popup",
      "popup-leafy",
      "popup-next",
      "dropzone",
      "submit",
    ].map((name) => [name, at(name)]),
  );

  growth.set(GROWTH_FROM);
  d.intro();

  // Pick up where they left off.
  move(P.continue, ">0.3", 1.1);
  camera(P.continue, 1.9, "<0.2", 1.2);
  click("continue", ">0.15");

  // Into the module.
  camera(null, 1, ">0.1", 1.0);
  swap("dashboard", "module", "<");
  nav("dashboard", "learning", "<");
  move(P["lesson-2-title"], "<0.3", 1.0);
  camera(P["lesson-2-title"], 1.8, "<0.4", 1.0);
  click("lesson-2", ">0.1");

  // Finish the lesson.
  camera(null, 1, ">0.1", 0.9);
  swap("module", "lesson", "<");
  tl.fromTo(q("video-bar"), { width: "62%" }, { width: "100%", duration: 1.4, ease: "none" }, "<0.4");
  move(P.complete, "<0.2", 1.1);
  camera(P.complete, 2.2, "<0.3", 1.1);
  click("complete", ">0.1");
  tl.to(q("complete-fill"), { scaleX: 1, duration: 0.5, ease: "expo.out" }, "<0.1")
    .to(q("complete"), { borderColor: "#16a34a", duration: 0.3 }, "<")
    .to(q("complete-label"), { autoAlpha: 0, y: -8, duration: 0.25 }, "<")
    .fromTo(q("complete-done"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35 }, "<0.1")
    .to(q("side-check"), { backgroundColor: "#dcfce7", color: "#15803d", duration: 0.3 }, "<");

  // The celebration pops up and Leafy grows by half in front of them.
  camera(null, 1, ">0.3", 0.8);
  d.openDialog("popup", "<0.3");
  move(d.phone ? { x: P.popup.x + 140, y: P.popup.y + 300 } : { x: P.popup.x + 240, y: P.popup.y + 140 }, "<", 0.8);
  camera(P["popup-leafy"], 2, ">-0.3", 1.1);
  const grown = { value: GROWTH_FROM };
  tl.fromTo(
    q("popup-glow"),
    { autoAlpha: 0, scale: 0.5 },
    { autoAlpha: 1, scale: 1.3, duration: 0.9, ease: "expo.out" },
    ">0.1",
  )
    .to(
      grown,
      {
        value: GROWTH_TO,
        duration: 3,
        ease: "power2.inOut",
        onUpdate: () => growth.set(grown.value),
      },
      "<",
    )
    .to(q("popup-glow"), { scale: 1.7, autoAlpha: 0, duration: 1, ease: "power2.out" }, ">-0.2");
  camera(P.popup, 1.35, "<", 1.0);

  // The pop-up's button leads on to the assignment.
  move(P["popup-next"], ">0.3", 1.0);
  click("popup-next", ">0.05");
  d.closeDialog("popup", ">0.05");
  camera(null, 1, "<", 0.8);
  swap("lesson", "assignment", "<");
  nav("learning", "assignments", "<");

  // Drag a file in from the edge of the screen.
  d.dropFile("dropzone", 1.45);
  tl.fromTo(q("upload"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }, "<")
    .fromTo(q("upload-bar"), { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power2.inOut" }, "<0.2")
    .to(q("submit"), { opacity: 1, duration: 0.3 }, ">");

  // Submit it.
  move(P.submit, "<", 0.9);
  camera(P.submit, 2, "<0.1", 1.0);
  click("submit", ">0.1");
  d.badge("status", "<0.1");
  camera(d.phone ? d.at("status-to") : { x: P.submit.x - 200, y: 120 }, 1.7, ">0.3", 0.9);

  d.outro();
}
