import { Check } from "lucide-react";

import { RiseMark } from "@/components/landing/RiseMark";

const STEPS = [
  {
    title: "Set up your space",
    body: "Create cohorts and shape the tracks your learners will follow from day one.",
    tags: ["Cohorts", "Tracks"],
  },
  {
    title: "Build your curriculum",
    body: "Add modules, lessons, and resources in the order they should be learned.",
    tags: ["Modules", "Lessons", "Resources"],
  },
  {
    title: "Teach and give feedback",
    body: "Run live classes, collect assignments, and leave feedback where it helps.",
    tags: ["Live classes", "Assignments"],
  },
  {
    title: "Watch progress rise",
    body: "See who is thriving and who needs a nudge, so everyone knows what comes next.",
    tags: ["Progress", "Outcomes"],
  },
];

/** The steps as a curriculum: each is ticked off as the line reaches it. */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      data-bg="#F5F6FF"
      className="px-4 py-19 lg:py-[128px]"
    >
      <div className="mx-auto max-w-[760px]">
        <div className="flex flex-col items-center text-center">
          <RiseMark />
          <h2
            data-reveal="lines"
            className="mt-6 max-w-[620px] text-[36px] leading-[1.08] font-black tracking-[-0.035em] text-brand-950 lg:text-[56px]"
          >
            From your first class to real progress.
          </h2>
        </div>

        <ol data-path className="relative mt-14 lg:mt-18">
          <span
            aria-hidden
            className="absolute top-7 bottom-7 left-[27px] w-[3px] rounded-full bg-brand-200"
          />
          <span
            aria-hidden
            data-path-fill
            className="absolute top-7 bottom-7 left-[27px] w-[3px] origin-top rounded-full bg-brand-700"
          />
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              data-path-step
              data-done="false"
              className="group relative flex gap-6 pb-13 last:pb-0 lg:gap-10 lg:pb-16"
            >
              <span className="relative z-10 flex size-13 shrink-0 items-center justify-center rounded-full border-[3px] border-brand-200 bg-white font-work text-[17px] font-bold text-brand-700 transition-colors duration-500 group-data-[done=true]:border-brand-700 group-data-[done=true]:bg-brand-700 group-data-[done=true]:text-white">
                <span className="transition-[scale,opacity] duration-300 group-data-[done=true]:scale-0 group-data-[done=true]:opacity-0">
                  {index + 1}
                </span>
                <Check
                  aria-hidden
                  strokeWidth={3}
                  className="absolute size-6 scale-0 opacity-0 transition-[scale,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-data-[done=true]:scale-100 group-data-[done=true]:opacity-100"
                />
              </span>
              <div className="pt-2">
                <h3 className="text-[24px] leading-[1.2] font-bold tracking-[-0.015em] text-brand-950 lg:text-[30px]">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[480px] text-[16px] leading-7 text-text-secondary lg:text-[17px]">
                  {step.body}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {step.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-brand-200 bg-white px-3 py-1 text-[13px] font-semibold text-brand-800"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
