import {
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  FileSpreadsheet,
  Layers,
  LayoutDashboard,
  Megaphone,
  Send,
  TriangleAlert,
  UploadCloud,
  UserPlus,
  Users,
} from "lucide-react";

import {
  Activity02,
  Admin,
  Coins01,
  Cohorts as CohortsIcon,
  DashboardSquare01,
  Marketing,
  Mentor,
  Message01,
  Notification02,
  Structure01,
  Teacher,
  Track,
  UserMultiple,
  Video02,
} from "@/assets/icons";

import type { Director } from "../director";
import { cn } from "@/lib/utils";

import { Card, DemoDialog, Initials, ProgressBar, Shell, Toast, usePhone } from "../kit";

const NAV = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
  { id: "cohorts", title: "Cohorts", icon: Layers },
  { id: "students", title: "Students", icon: Users },
  { id: "announcements", title: "Announcements", icon: Megaphone },
];

/** The admin's full sidebar, as in the app. */
const SECTIONS = [
  { label: "Overview", items: [{ id: "dashboard", title: "Dashboard", icon: DashboardSquare01 }] },
  { label: "Operations", items: [{ id: "live", title: "Live Sessions", icon: Video02 }] },
  {
    label: "People",
    items: [
      { id: "students", title: "Students", icon: UserMultiple },
      { id: "instructors", title: "Instructors", icon: Teacher },
      { id: "mentors", title: "Mentors", icon: Mentor },
      { id: "admins", title: "Admins", icon: Admin },
    ],
  },
  {
    label: "Academy",
    items: [
      { id: "cohorts", title: "Cohorts", icon: CohortsIcon },
      { id: "tracks", title: "Tracks", icon: Track },
      { id: "curriculum", title: "Curriculum", icon: Structure01 },
    ],
  },
  {
    label: "Insight",
    items: [
      { id: "reports", title: "Reports", icon: Coins01 },
      { id: "activity", title: "Activity Log", icon: Activity02 },
    ],
  },
  {
    label: "Communication",
    items: [
      { id: "announcements", title: "Announcements", icon: Marketing },
      { id: "notifications", title: "Notifications", icon: Notification02 },
      { id: "messages", title: "Messages", icon: Message01 },
    ],
  },
];

const TRACKS = [
  ["Product design", 82],
  ["Software engineering", 76],
  ["Data analysis", 69],
  ["Product management", 88],
] as const;

const INVITED = ["Ada Okafor", "Kunle Ojo", "Sade Bello", "Emeka Udo", "Hauwa Sani"];

function DashboardScene() {
  const phone = usePhone();
  return (
    <div data-scene="dashboard" className={cn("absolute inset-0", phone ? "px-5" : "px-8 pb-8")}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className={cn("font-bold text-neutral-800", phone ? "text-xl" : "text-2xl")}>
            {phone ? "Overview" : "Programme overview"}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">Cohort 4 · Week 6 of 16</p>
        </div>
        <span
          data-demo="invite"
          className="flex h-10 items-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-medium text-white"
        >
          <UserPlus className="size-4" />
          {phone ? "Invite" : "Invite students"}
        </span>
      </div>

      <div className={cn("grid", phone ? "mt-5 grid-cols-2 gap-3" : "mt-6 grid-cols-4 gap-5")}>
        <Card data-demo="participants-card" className={phone ? "p-4" : "p-5"}>
          <p className="text-xs font-medium tracking-wider text-neutral-400 uppercase">Participants</p>
          <p className="mt-2 text-3xl font-bold text-neutral-800">
            <span data-demo="participants">248</span>
          </p>
          <span className="grid text-xs">
            <span data-demo="participants-was" className="mt-1 text-neutral-400 [grid-area:1/1]">
              Across 6 tracks
            </span>
            <span
              data-demo="participants-delta"
              className="mt-1 font-medium text-green-700 opacity-0 [grid-area:1/1]"
            >
              +40 this week
            </span>
          </span>
        </Card>
        {[
          ["Active tracks", "6", "2 launching soon"],
          ["Engagement", "87%", "+4% on last week"],
          ["At risk", "12", "3 new this week"],
        ].map(([label, value, meta]) => (
          <Card key={label} className={phone ? "p-4" : "p-5"}>
            <p className="text-xs font-medium tracking-wider text-neutral-400 uppercase">{label}</p>
            <p className="mt-2 text-3xl font-bold text-neutral-800">{value}</p>
            <p className="mt-1 text-xs text-neutral-400">{meta}</p>
          </Card>
        ))}
      </div>

      <div className={cn("mt-5 grid gap-5", !phone && "grid-cols-[1.5fr_1fr]")}>
        <Card className="p-5">
          <p className="font-medium text-neutral-800">Programme health</p>
          <p className="text-xs text-neutral-400">Lessons completed on time, by track</p>
          <div className="mt-5 space-y-4">
            {TRACKS.map(([name, value]) => (
              <div key={name} className="text-sm">
                <div className="mb-1.5 flex justify-between">
                  <span className="text-neutral-600">{name}</span>
                  <span className="font-medium text-neutral-800">{value}%</span>
                </div>
                <ProgressBar value={value} />
              </div>
            ))}
          </div>
        </Card>
        <Card className={cn("p-5", phone && "hidden")}>
          <p className="font-medium text-neutral-800">Needs attention</p>
          <div className="mt-4 space-y-3 text-sm">
            {[
              [TriangleAlert, "12 students at risk", "3 new this week", "bg-red-50 text-red-600"],
              [CalendarCheck, "This week's check-ins", "Due Friday", "bg-surface-brand text-brand-600"],
              [ClipboardList, "34 assignments to grade", "Across all tracks", "bg-surface-warning-badge text-amber-700"],
            ].map(([Icon, title, meta, tone]) => {
              const I = Icon as typeof TriangleAlert;
              return (
                <div key={title as string} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
                  <span className={`flex size-9 items-center justify-center rounded-lg ${tone as string}`}>
                    <I className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium text-neutral-800">{title as string}</p>
                    <p className="text-xs text-neutral-400">{meta as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function InviteDialog() {
  const phone = usePhone();
  return (
    <DemoDialog id="invite-dialog" className={phone ? "w-[350px]" : "w-[480px]"}>
      <p className="text-lg font-bold text-neutral-800">Invite students</p>
      <p className="mt-1 text-sm text-neutral-500">They&apos;ll get an email to set up their account.</p>

      <p className="mt-5 mb-2 text-xs font-medium text-neutral-500">Cohort</p>
      <div className="flex h-10 items-center justify-between rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800">
        Cohort 5 · Product design
        <ChevronDown className="size-4 text-neutral-400" />
      </div>

      <p className="mt-4 mb-2 text-xs font-medium text-neutral-500">Students</p>
      <div className="grid">
        <div
          data-demo="csv-drop"
          className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-center [grid-area:1/1]"
        >
          <UploadCloud className="size-6 text-brand-600" />
          <p className="mt-2 text-sm font-medium text-neutral-800">Drop a CSV or paste emails</p>
        </div>
        <div
          data-demo="csv-result"
          className="flex h-32 flex-col justify-center rounded-xl border border-neutral-200 bg-white px-4 opacity-0 [grid-area:1/1]"
        >
          <div className="flex items-center gap-3 text-sm">
            <span className="flex size-10 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <FileSpreadsheet className="size-5" />
            </span>
            <div>
              <p className="font-medium text-neutral-800">cohort-5.csv</p>
              <p className="text-xs text-neutral-500">
                <span data-demo="csv-count">0</span> students found
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center">
            {INVITED.map((name, index) => (
              <span key={name} data-demo={`csv-av-${index}`} className="-mr-2 rounded-full ring-2 ring-white">
                <Initials name={name} tone={index} className="size-8" />
              </span>
            ))}
            <span className="ml-4 text-xs font-medium text-neutral-500">+35 more</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2 text-sm font-medium">
        <span className="flex h-10 items-center px-4 text-neutral-500">Cancel</span>
        <span
          data-demo="send-invites"
          className="flex h-10 items-center gap-2 rounded-lg bg-brand-primary px-4 text-white opacity-40"
        >
          <Send className="size-4" />
          Send 40 invites
        </span>
      </div>
    </DemoDialog>
  );
}

export function AdminApp() {
  return (
    <Shell
      nav={NAV}
      sections={SECTIONS}
      active="dashboard"
      crumbs={[{ id: "dashboard", parts: ["Dashboard"] }]}
      user={{ name: "Femi Adebayo", meta: "Programme admin" }}
      file="cohort-5.csv"
      overlay={
        <>
          <InviteDialog />
          <Toast id="toast-invites" icon={Send}>
            40 invites sent to Cohort 5
          </Toast>
        </>
      }
    >
      <DashboardScene />
    </Shell>
  );
}

export function adminScript(d: Director) {
  const { tl, q, at, camera, move, click } = d;
  const P = {
    invite: at("invite"),
    dialog: at("invite-dialog"),
    send: at("send-invites"),
    participants: at("participants-card"),
  };
  const avatars = INVITED.map((_, index) => q(`csv-av-${index}`));

  d.intro();

  // Open the invite dialog.
  move(P.invite, ">0.3", 1.1);
  camera(P.invite, 1.9, "<0.2", 1.2);
  click("invite", ">0.1");
  camera(null, 1, ">0.1", 0.8);
  d.openDialog("invite-dialog", "<0.2");
  camera(P.dialog, 1.4, ">-0.2", 0.9);

  // Drop in the class list.
  d.dropFile("csv-drop", 1.7);
  tl.to(q("csv-drop"), { autoAlpha: 0, duration: 0.2 }, "<")
    .fromTo(q("csv-result"), { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "expo.out" }, "<");
  d.count("csv-count", 0, 40, "<0.1", 1.0);
  tl.fromTo(
    avatars,
    { autoAlpha: 0, scale: 0 },
    { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.07, ease: "back.out(2.2)" },
    "<",
  ).to(q("send-invites"), { opacity: 1, duration: 0.3 }, ">");

  // Send them out.
  move(P.send, "<", 0.8);
  camera(P.send, 1.9, "<0.1", 0.9);
  click("send-invites", ">0.1");
  d.closeDialog("invite-dialog", ">0.15");
  camera(null, 1, "<", 0.8);
  d.toast("toast-invites", ">-0.3", 1.6);

  // The programme grows by a whole class.
  camera(P.participants, 2, ">0.4", 1.1);
  tl.to(d.cursor, { x: P.participants.x + 120, y: P.participants.y + 90, duration: 1 }, "<");
  d.count("participants", 248, 288, ">-0.2", 1.3);
  tl.to(q("participants-was"), { autoAlpha: 0, y: -6, duration: 0.25 }, "<0.3").fromTo(
    q("participants-delta"),
    { autoAlpha: 0, y: 6 },
    { autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(2)" },
    ">-0.05",
  );

  d.outro();
}
