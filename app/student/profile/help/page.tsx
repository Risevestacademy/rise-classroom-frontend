"use client";

import { Accordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";

import {
  ProfileColumn,
  ProfileSubpageHeader,
} from "@/components/student-settings/ProfileParts";

const faqs = [
  {
    question: "How do I join a live class?",
    answer:
      "Open your Dashboard and look at Upcoming Event. When your class is about to start, click Join to open the class link. If your instructor has added a recording, you'll find it on the module page.",
  },
  {
    question: "Where can I find my lessons and recordings?",
    answer:
      "Go to My learning and open a module. Each lesson has its notes, resources and any recordings your instructor has added.",
  },
  {
    question: "What happens after I submit an assignment?",
    answer:
      "Your instructor reviews it and leaves feedback. You'll get a notification when it's reviewed, and you can read the feedback on the assignment page.",
  },
  {
    question: "Can I submit after the deadline?",
    answer:
      "That depends on your track's rules. If late submissions are allowed, the assignment stays open and is marked late. If not, reach out to your instructor or mentor.",
  },
  {
    question: "How is my attendance recorded?",
    answer:
      "You're marked present when you join a live class through Rise Classroom. Joining late or leaving early may count as a partial attendance.",
  },
  {
    question: "How do I change my email or track?",
    answer:
      "Your email and track are managed by your admin. Contact them and they'll update it for you.",
  },
];

export default function HelpAndSupportPage() {
  return (
    <ProfileColumn>
      <ProfileSubpageHeader
        title="Help and support"
        description="Answers to common questions"
      />
      <Accordion.Root className="flex flex-col gap-3">
        {faqs.map((faq) => (
          <Accordion.Item
            key={faq.question}
            className="rounded-xl border border-neutral-200 bg-white"
          >
            <Accordion.Header>
              <Accordion.Trigger className="group flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-medium text-neutral-800 outline-none focus-visible:ring-2 focus-visible:ring-border-focus sm:px-5">
                {faq.question}
                <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-data-[panel-open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
              <p className="px-4 pb-4 text-sm text-neutral-500 sm:px-5">{faq.answer}</p>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </ProfileColumn>
  );
}
