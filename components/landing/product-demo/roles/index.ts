import { GraduationCap, HeartHandshake, Presentation, ShieldCheck } from "lucide-react";

import { AdminApp, adminScript } from "./admin";
import { InstructorApp, instructorScript } from "./instructor";
import { MentorApp, mentorScript } from "./mentor";
import { StudentApp, studentScript } from "./student";

export const ROLES = [
  {
    id: "student",
    label: "Students",
    icon: GraduationCap,
    caption: "Pick up the next lesson, finish it and watch Leafy grow.",
    description:
      "A student continues a module, completes a lesson, watches Leafy grow and submits an assignment.",
    App: StudentApp,
    script: studentScript,
  },
  {
    id: "instructor",
    label: "Instructors",
    icon: Presentation,
    caption: "Build a module, publish it and grade the work that comes in.",
    description:
      "An instructor adds a lesson, reorders the module, publishes it and grades a submission.",
    App: InstructorApp,
    script: instructorScript,
  },
  {
    id: "mentor",
    label: "Mentors",
    icon: HeartHandshake,
    caption: "Spot who's slipping and book a check-in before they fall behind.",
    description:
      "A mentor filters to at-risk students, opens one and books a check-in with them.",
    App: MentorApp,
    script: mentorScript,
  },
  {
    id: "admin",
    label: "Admins",
    icon: ShieldCheck,
    caption: "Invite a whole class and watch the programme fill up.",
    description:
      "An admin uploads a class list, sends 40 invites and sees participants rise on the dashboard.",
    App: AdminApp,
    script: adminScript,
  },
];
