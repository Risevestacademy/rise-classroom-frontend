import {
  CalendarCheck,
  LayoutDashboard,
  MessageSquare,
  TriangleAlert,
  Users,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { Director } from "../director";
import { Badge, BadgeSwap, Card, Initials, Shell, Toast, usePhone } from "../kit";

const NAV = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
  { id: "live", title: "Live sessions", icon: Video },
  { id: "students", title: "My students", icon: Users },
  { id: "messages", title: "Messages", icon: MessageSquare },
];

const ROW = 60;

const STUDENTS = [
  { name: "Amaka Obi", progress: 72, active: "2 hours ago" },
  { name: "Tunde Bakare", progress: 31, active: "6 days ago", risk: true },
  { name: "Chidi Nwosu", progress: 64, active: "Yesterday" },
  { name: "Zainab Musa", progress: 18, active: "9 days ago", risk: true },
  { name: "Ifeanyi Eze", progress: 55, active: "Today" },
  { name: "Ngozi Okafor", progress: 80, active: "3 hours ago" },
];

/** Tunde's lessons per week, tailing off. */
const ACTIVITY = [70, 84, 62, 78, 56, 28, 12, 6];

function StudentsScene() {
  const phone = usePhone();
  const COLUMNS = cn(
    "grid items-center gap-4",
    phone ? "grid-cols-[1fr_auto]" : "grid-cols-[1.6fr_1.4fr_1fr_140px]",
  );
  return (
    <div data-scene="students" className={cn("absolute inset-0", phone ? "px-5" : "px-8 pb-8")}>
      <h3 className="text-2xl font-bold text-neutral-800">My students</h3>
      <p className="mt-1 text-sm text-neutral-500">Design track · Cohort 4 · Week 6</p>

      <div className="mt-5 flex gap-2 text-sm font-medium">
        <span
          data-demo="filter-all"
          className="rounded-full border border-brand-primary bg-brand-primary px-3 py-1.5 text-white"
        >
          All · 12
        </span>
        <span
          data-demo="filter-risk"
          className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-500"
        >
          <span className="size-2 rounded-full bg-red-500" />
          At risk · 2
        </span>
        <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-500">
          Check-in due · 3
        </span>
      </div>

      <Card className="mt-4 overflow-hidden">
        <div
          className={cn(
            COLUMNS,
            "border-b border-neutral-200 px-5 py-3 text-xs font-medium tracking-wider text-neutral-400 uppercase",
          )}
        >
          <span>Student</span>
          {!phone && <span>Progress</span>}
          {!phone && <span>Last active</span>}
          <span>Status</span>
        </div>
        <div data-demo="table-body" className="relative" style={{ height: STUDENTS.length * ROW }}>
          {STUDENTS.map((student, index) => (
            <div
              key={student.name}
              data-demo={`stu-${index}`}
              className={cn(
                COLUMNS,
                "absolute inset-x-0 border-b border-neutral-100 bg-white text-sm",
                phone ? "px-4" : "px-5",
              )}
              style={{ top: index * ROW, height: ROW }}
            >
              <span className="flex items-center gap-3 font-medium text-neutral-800">
                <Initials name={student.name} tone={index} />
                <span className="leading-4">
                  <span data-demo={`stu-${index}-name`}>{student.name}</span>
                  {phone && (
                    <span
                      className={cn(
                        "block text-xs font-normal",
                        student.risk ? "text-red-600" : "text-neutral-400",
                      )}
                    >
                      {student.active}
                    </span>
                  )}
                </span>
              </span>
              <span className={cn("flex items-center gap-3", phone && "hidden")}>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <span
                    className={cn("block h-full rounded-full", student.risk ? "bg-red-400" : "bg-brand-primary")}
                    style={{ width: `${student.progress}%` }}
                  />
                </span>
                <span className="w-9 text-xs text-neutral-500">{student.progress}%</span>
              </span>
              {!phone && (
                <span className={student.risk ? "text-red-600" : "text-neutral-500"}>{student.active}</span>
              )}
              {index === 1 ? (
                <BadgeSwap id="tunde-status" from={["error", "At risk"]} to={["brand", "Check-in booked"]} />
              ) : student.risk ? (
                <Badge tone="error">At risk</Badge>
              ) : (
                <Badge tone="success">On track</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card
        data-demo="drawer"
        className={cn(
          "absolute top-0 p-5 opacity-0 shadow-2xl",
          phone ? "inset-x-4 bottom-4" : "right-8 bottom-8 w-[380px]",
        )}
      >
        <div className="flex items-center gap-3">
          <Initials name="Tunde Bakare" tone={1} className="size-12 text-sm" />
          <div>
            <p className="font-bold text-neutral-800">Tunde Bakare</p>
            <p className="text-xs text-neutral-400">Design track · 31% complete</p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          Missed 2 check-ins and hasn&apos;t opened a lesson in 6 days.
        </div>

        <div data-demo="activity" className="mt-5">
          <p className="text-xs font-medium tracking-wider text-neutral-400 uppercase">
            Lessons per week
          </p>
          <div className="mt-3 flex h-24 items-end gap-2">
            {ACTIVITY.map((value, index) => (
              <span
                key={index}
                data-demo={`bar-${index}`}
                className={cn("flex-1 origin-bottom rounded-md", index > 4 ? "bg-red-300" : "bg-brand-200")}
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
        </div>

        <span
          data-demo="book"
          className="mt-6 flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-primary text-sm font-medium text-white"
        >
          <CalendarCheck className="size-4" />
          Book a check-in
        </span>

        <div data-demo="slots" className="mt-4 opacity-0">
          <p className="mb-2 text-xs font-medium text-neutral-500">Pick a time this week</p>
          <div className="grid grid-cols-3 gap-2 text-sm font-medium">
            {["Thu 10:00", "Thu 14:00", "Fri 11:00"].map((slot) => (
              <span
                key={slot}
                data-demo={slot === "Thu 14:00" ? "slot" : undefined}
                className="flex h-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700"
              >
                {slot}
              </span>
            ))}
          </div>
          <span
            data-demo="send"
            className="mt-3 flex h-10 items-center justify-center rounded-lg border border-brand-primary text-sm font-medium text-brand-primary opacity-40"
          >
            Send invite
          </span>
        </div>
      </Card>
    </div>
  );
}

export function MentorApp() {
  return (
    <Shell
      nav={NAV}
      active="students"
      crumbs={[{ id: "students", parts: ["My students"] }]}
      user={{ name: "Bola Martins", meta: "Mentor · 12 students" }}
      overlay={
        <Toast id="toast-booked" icon={CalendarCheck}>
          Check-in booked with Tunde · Thursday, 14:00
        </Toast>
      }
    >
      <StudentsScene />
    </Shell>
  );
}

export function mentorScript(d: Director) {
  const { tl, q, at, camera, move, click } = d;
  // Tunde's row ends up one row higher once the list is filtered.
  const P = {
    filter: at("filter-risk"),
    tunde: at("stu-1-name", 0, -ROW),
    status: at("tunde-status-from", 0, -ROW),
    activity: at("activity"),
    book: at("book"),
    slot: at("slot"),
    send: at("send"),
  };
  const others = [0, 2, 4, 5].map((index) => q(`stu-${index}`));
  const bars = ACTIVITY.map((_, index) => q(`bar-${index}`));

  d.intro();

  // Filter down to the students who are slipping.
  move(P.filter, ">0.3", 1.1);
  camera(P.filter, 2, "<0.2", 1.1);
  click("filter-risk", ">0.1");
  tl.to(q("filter-all"), { backgroundColor: "#ffffff", borderColor: "#e2e8e8", color: "#475355", duration: 0.3 }, "<")
    .to(q("filter-risk"), { backgroundColor: "#080d38", borderColor: "#080d38", color: "#ffffff", duration: 0.3 }, "<");
  camera(null, 1, ">0.1", 0.9);
  tl.to(others, { autoAlpha: 0, x: -12, duration: 0.3, stagger: 0.04, ease: "power2.in" }, "<")
    .to(q("stu-1"), { y: -ROW, duration: 0.6, ease: "expo.out" }, ">-0.1")
    .to(q("stu-3"), { y: -2 * ROW, duration: 0.6, ease: "expo.out" }, "<0.05")
    .to(q("table-body"), { height: 2 * ROW, duration: 0.6, ease: "expo.out" }, "<");

  // Open Tunde.
  move(P.tunde, ">0.1", 0.9);
  camera(P.tunde, 1.8, "<0.2", 1.0);
  click("stu-1", ">0.1");
  camera(null, 1, ">0.1", 0.8);
  tl.fromTo(q("drawer"), { autoAlpha: 0, x: 60 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "expo.out" }, "<0.1")
    .fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.5, stagger: 0.05, ease: "expo.out" }, "<0.3");
  camera(P.activity, 1.7, ">-0.3", 1.0);
  tl.to(d.cursor, { x: P.activity.x - 40, y: P.activity.y + 90, duration: 1 }, "<");

  // Book a check-in before it gets worse.
  move(P.book, ">0.5", 0.9);
  camera(P.book, 1.9, "<0.1", 1.0);
  click("book", ">0.1");
  d.show("slots", ">0.1");
  move(P.slot, ">0.1", 0.7);
  click("slot", ">0.05");
  tl.to(q("slot"), { backgroundColor: "#080d38", borderColor: "#080d38", color: "#ffffff", duration: 0.25 }, "<")
    .to(q("send"), { opacity: 1, duration: 0.3 }, "<");
  move(P.send, ">0.2", 0.6);
  click("send", ">0.05");
  tl.to(q("drawer"), { autoAlpha: 0, x: 60, duration: 0.4, ease: "power2.in" }, ">0.2");
  camera(null, 1, "<", 0.9);
  d.toast("toast-booked", "<0.2", 1.5);

  // Tunde is no longer just a red badge.
  camera(P.status, 2, ">0.3", 1.0);
  tl.to(d.cursor, { x: P.status.x + 80, y: P.status.y + 60, duration: 0.9 }, "<");
  d.badge("tunde-status", ">-0.2");

  d.outro();
}
