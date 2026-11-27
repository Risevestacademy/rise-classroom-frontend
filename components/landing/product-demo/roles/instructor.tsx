import {
  BookOpen,
  Check,
  FileCheck,
  FileText,
  FolderKanban,
  GripVertical,
  LayoutDashboard,
  Plus,
  Send,
  Video,
} from "lucide-react";

import type { Director } from "../director";
import { cn } from "@/lib/utils";

import { Badge, BadgeSwap, Card, Initials, Shell, Toast, usePhone } from "../kit";

const NAV = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
  { id: "tracks", title: "My tracks", icon: FolderKanban },
  { id: "curriculum", title: "Curriculum", icon: BookOpen },
  { id: "assignments", title: "Assignments", icon: FileCheck },
];

const CRUMBS = [
  { id: "curriculum", parts: ["Curriculum", "User Research and Analysis"] },
  { id: "assignments", parts: ["Assignments", "Persona deck"] },
];

const ROW = 68;
const HEAD = 64;

const LESSONS = [
  { title: "Planning user interviews", meta: "Video · 12 min" },
  { title: "Building personas", meta: "Video · 18 min" },
  { title: "Mapping the user journey", meta: "Reading · 15 min" },
];

const SUBMISSIONS = [
  { name: "Tunde Bakare", when: "2 hours ago" },
  { name: "Amaka Obi", when: "Yesterday", grade: "17/20" },
  { name: "Chidi Nwosu", when: "Yesterday", grade: "19/20" },
  { name: "Zainab Musa", when: "2 days ago", grade: "15/20" },
];

function LessonRow({
  id,
  index,
  title,
  meta,
}: {
  id: string;
  index: number;
  title: React.ReactNode;
  meta: React.ReactNode;
}) {
  return (
    <div
      data-demo={id}
      className="absolute inset-x-0 flex items-center gap-4 border-b border-neutral-100 bg-white px-5"
      style={{ top: index * ROW, height: ROW }}
    >
      <span data-demo={`${id}-grip`} className="text-neutral-300">
        <GripVertical className="size-4" />
      </span>
      <span
        data-demo={`${id}-num`}
        className="flex size-8 items-center justify-center rounded-full bg-surface-brand text-sm font-medium text-brand-600"
      >
        {index + 1}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-800">{title}</p>
        <p className="text-xs text-neutral-400">{meta}</p>
      </div>
      <Video className="size-4 text-neutral-400" />
    </div>
  );
}

function CurriculumScene() {
  const phone = usePhone();
  return (
    <div
      data-scene="curriculum"
      className={cn(
        "absolute inset-0",
        phone ? "flex flex-col gap-4 px-5" : "grid grid-cols-[1fr_280px] gap-5 px-8 pb-8",
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className={cn("flex gap-3", phone ? "flex-col items-start gap-2" : "items-center")}>
              <h3 className={cn("font-bold text-neutral-800", phone ? "text-xl" : "text-2xl")}>
                02. User Research and Analysis
              </h3>
              <BadgeSwap id="module-status" from={["warning", "Draft"]} to={["success", "Published"]} />
            </div>
            <p className="mt-1 text-sm text-neutral-500">Design track · 32 students enrolled</p>
          </div>
        </div>

        <Card className={cn("overflow-hidden", phone ? "mt-4" : "mt-6")}>
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase">
            <span>Lessons</span>
            <span>Drag to reorder</span>
          </div>
          <div data-demo="lesson-list" className="relative" style={{ height: 3 * ROW + HEAD }}>
            {LESSONS.map((lesson, index) => (
              <LessonRow key={lesson.title} id={`row-${index + 1}`} index={index} {...lesson} />
            ))}
            <div className="opacity-0" data-demo="row-new-wrap">
              <LessonRow
                id="row-new"
                index={3}
                title={
                  <>
                    <span data-demo="new-title" />
                    <span
                      data-demo="new-caret"
                      className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-brand-primary"
                    />
                  </>
                }
                meta={
                  <span data-demo="new-meta" className="opacity-0">
                    Video · 20 min
                  </span>
                }
              />
            </div>
            <div
              data-demo="add-lesson"
              className="absolute inset-x-5 flex h-10 items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 text-sm font-medium text-brand-600"
              style={{ top: 3 * ROW + 12 }}
            >
              <Plus className="size-4" />
              Add lesson
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <span
          data-demo="publish"
          className="relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-lg bg-brand-primary text-sm font-medium text-white"
        >
          <span data-demo="publish-fill" className="absolute inset-0 origin-left scale-x-0 bg-green-600" />
          <span className="relative grid">
            <span data-demo="publish-label" className="flex items-center gap-2 [grid-area:1/1]">
              <Send className="size-4" />
              Publish module
            </span>
            <span data-demo="publish-done" className="flex items-center gap-2 opacity-0 [grid-area:1/1]">
              <Check className="size-4" />
              Published
            </span>
          </span>
        </span>
        <Card className={cn("text-sm", phone ? "flex justify-around p-3" : "space-y-3 p-5")}>
          {[
            ["Lessons", <span key="n" data-demo="lesson-count">3</span>],
            ["Length", <span key="m"><span data-demo="lesson-minutes">45</span> min</span>],
            ["Assignment", "Persona deck"],
            ["Opens", "Monday, 9am"],
          ]
            .slice(0, phone ? 2 : 4)
            .map(([label, value]) => (
            <div key={label as string} className={phone ? "flex gap-2" : "flex justify-between"}>
              <span className="text-neutral-500">{label}</span>
              <span className="font-medium text-neutral-800">{value}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function AssignmentsScene() {
  const phone = usePhone();
  const columns = phone ? "grid-cols-[1fr_auto]" : "grid-cols-[1fr_120px_130px]";
  return (
    <div
      data-scene="assignments"
      className={cn(
        "absolute inset-0 opacity-0",
        phone ? "px-5" : "grid grid-cols-[1fr_380px] gap-5 px-8 pb-8",
      )}
    >
      <div>
        <h3 className="text-2xl font-bold text-neutral-800">Persona deck</h3>
        <p className="mt-1 text-sm text-neutral-500">User Research · 28 of 32 submitted</p>
        <Card className="mt-5 divide-y divide-neutral-200">
          <div className={cn("grid px-5 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase", columns)}>
            <span>Student</span>
            {!phone && <span>Submitted</span>}
            <span>Status</span>
          </div>
          {SUBMISSIONS.map((sub, index) => (
            <div
              key={sub.name}
              data-demo={index === 0 ? "sub-1" : undefined}
              className={cn("grid items-center gap-3 px-5 py-3.5 text-sm", columns, phone && "px-4")}
            >
              <span className="flex items-center gap-3 font-medium text-neutral-800">
                <Initials name={sub.name} tone={index} />
                {sub.name}
              </span>
              {!phone && <span className="text-neutral-500">{sub.when}</span>}
              {sub.grade ? (
                <Badge tone="success">Graded · {sub.grade}</Badge>
              ) : (
                <BadgeSwap id="sub-1-status" from={["warning", "Needs grading"]} to={["success", "Graded · 18/20"]} />
              )}
            </div>
          ))}
        </Card>
      </div>

      <Card
        data-demo="grader"
        className={cn("h-fit p-5 opacity-0", phone && "absolute inset-x-4 top-0 shadow-2xl")}
      >
        <div className="flex items-center gap-3">
          <Initials name="Tunde Bakare" />
          <div className="text-sm">
            <p className="font-medium text-neutral-800">Tunde Bakare</p>
            <p className="text-xs text-neutral-400">Submitted 2 hours ago</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <FileText className="size-5" />
          </span>
          <div className="text-sm">
            <p className="font-medium text-neutral-800">persona-deck.pdf</p>
            <p className="text-xs text-neutral-400">12 pages · 4.2 MB</p>
          </div>
        </div>

        <p className="mt-5 mb-2 text-xs font-medium text-neutral-500">Score</p>
        <div
          data-demo="score"
          className="flex h-10 w-32 items-center justify-between rounded-lg border border-neutral-200 px-3 text-sm"
        >
          <span data-demo="score-value" className="font-medium text-neutral-800" />
          <span className="text-neutral-400">/ 20</span>
        </div>

        <p className="mt-4 mb-2 text-xs font-medium text-neutral-500">Feedback</p>
        <div
          data-demo="feedback"
          className="h-20 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800"
        >
          <span data-demo="feedback-text" />
        </div>

        <span
          data-demo="return"
          className="relative mt-5 flex h-10 items-center justify-center overflow-hidden rounded-lg bg-brand-primary text-sm font-medium text-white"
        >
          <span data-demo="return-fill" className="absolute inset-0 origin-left scale-x-0 bg-green-600" />
          <span className="relative grid">
            <span data-demo="return-label" className="[grid-area:1/1]">
              Return grade
            </span>
            <span data-demo="return-done" className="flex items-center gap-2 opacity-0 [grid-area:1/1]">
              <Check className="size-4" />
              Grade returned
            </span>
          </span>
        </span>
      </Card>
    </div>
  );
}

export function InstructorApp() {
  return (
    <Shell
      nav={NAV}
      active="curriculum"
      crumbs={CRUMBS}
      user={{ name: "Kemi Adeyemi", meta: "Instructor · Design" }}
      overlay={
        <Toast id="toast-published" icon={Send}>
          Module published · 32 students notified
        </Toast>
      }
    >
      <CurriculumScene />
      <AssignmentsScene />
    </Shell>
  );
}

export function instructorScript(d: Director) {
  const { tl, q, at, camera, move, click, swap, nav, type, count } = d;
  const P = Object.fromEntries(
    ["add-lesson", "new-title", "row-new-grip", "publish", "nav-assignments", "sub-1", "score", "feedback", "return"].map(
      (name) => [name, at(name)],
    ),
  );
  const lift = "0 18px 40px -12px rgb(8 13 56 / 0.35)";

  d.intro();

  // Add a lesson.
  move(P["add-lesson"], ">0.3", 1.1);
  camera(P["add-lesson"], 1.8, "<0.2", 1.2);
  click("add-lesson", ">0.1");
  tl.to(q("add-lesson"), { y: ROW, duration: 0.5, ease: "expo.out" }, ">")
    .to(q("lesson-list"), { height: 4 * ROW + HEAD, duration: 0.5, ease: "expo.out" }, "<")
    .fromTo(q("row-new-wrap"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }, "<0.05");
  camera({ x: P["new-title"].x + 90, y: P["new-title"].y }, 2.1, "<", 0.9);
  move({ x: P["new-title"].x + 300, y: P["new-title"].y + 60 }, "<", 0.7);
  type("new-title", "Usability testing", ">0.2", 0.06);
  tl.to(q("new-caret"), { autoAlpha: 0, duration: 0.1 }, ">0.2")
    .fromTo(q("new-meta"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, "<");
  count("lesson-count", 3, 4, "<", 0.4);
  count("lesson-minutes", 45, 65, "<", 0.8);

  // Drag it up, before the journey map.
  camera({ x: at("lesson-list").x, y: P["row-new-grip"].y - ROW / 2 }, 1.4, ">0.2", 1.0);
  move(P["row-new-grip"], "<0.1", 0.9);
  d.press(">0.1");
  tl.to(q("row-new"), { scale: 1.02, boxShadow: lift, zIndex: 10, duration: 0.25 }, "<")
    .to(q("row-new"), { y: -ROW, duration: 0.9 }, ">0.1")
    .to(d.cursor, { y: P["row-new-grip"].y - ROW, duration: 0.9 }, "<")
    .to(q("row-3"), { y: ROW, duration: 0.5, ease: "expo.out" }, "<0.3")
    .call(
      () => {
        q("row-3-num").textContent = "4";
        q("row-new-num").textContent = "3";
      },
      undefined,
      "<0.2",
    );
  d.release(">0.1");
  tl.to(q("row-new"), { scale: 1, boxShadow: "0 0 0 0 rgb(8 13 56 / 0)", duration: 0.3 }, "<");

  // Publish the module.
  camera(null, 1, ">0.3", 0.9);
  move(P.publish, "<0.1", 1.0);
  camera(P.publish, 2, "<0.3", 1.0);
  click("publish", ">0.1");
  tl.to(q("publish-fill"), { scaleX: 1, duration: 0.5, ease: "expo.out" }, "<0.1")
    .to(q("publish-label"), { autoAlpha: 0, y: -8, duration: 0.25 }, "<")
    .fromTo(q("publish-done"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35 }, "<0.1");
  d.badge("module-status", "<");
  camera(null, 1, ">0.4", 0.9);
  d.toast("toast-published", "<0.3", 1.4);

  // Grade what came in.
  move(P["nav-assignments"], ">0.4", 1.0);
  click(undefined, ">0.05");
  swap("curriculum", "assignments", ">0.1");
  nav("curriculum", "assignments", "<");
  move(P["sub-1"], "<0.2", 1.0);
  camera(P["sub-1"], 1.6, "<0.2", 1.0);
  click("sub-1", ">0.1");
  tl.to(q("sub-1"), { backgroundColor: "#f5f6ff", duration: 0.3 }, "<");
  camera(null, 1, ">0.1", 0.8);
  tl.fromTo(q("grader"), { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "expo.out" }, "<0.1");

  move(P.score, ">0.1", 0.9);
  camera(P.score, 2, "<0.2", 1.0);
  click("score", ">0.1");
  tl.to(q("score"), { borderColor: "#6c77e6", duration: 0.2 }, "<");
  type("score-value", "18", ">0.1", 0.15);

  move({ x: P.feedback.x - 60, y: P.feedback.y }, ">0.2", 0.7);
  camera(P.feedback, 1.8, "<", 0.8);
  click("feedback", ">0.05");
  tl.to(q("score"), { borderColor: "#e2e8e8", duration: 0.2 }, "<")
    .to(q("feedback"), { borderColor: "#6c77e6", duration: 0.2 }, "<");
  type("feedback-text", "Strong personas. Push the quotes further.", ">0.1", 0.035);

  move(P.return, ">0.2", 0.8);
  camera(P.return, 1.9, "<", 0.9);
  click("return", ">0.1");
  tl.to(q("return-fill"), { scaleX: 1, duration: 0.5, ease: "expo.out" }, "<0.1")
    .to(q("return-label"), { autoAlpha: 0, y: -8, duration: 0.25 }, "<")
    .fromTo(q("return-done"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35 }, "<0.1");
  camera(P["sub-1"], 1.6, ">0.3", 1.0);
  d.badge("sub-1-status", ">-0.3");

  d.outro();
}
