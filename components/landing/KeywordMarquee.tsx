import { Asterisk } from "lucide-react";

const KEYWORDS = [
  "Cohorts",
  "Curriculum",
  "Assignments",
  "Progress",
  "Community",
  "Feedback",
  "Milestones",
];

/** Endless strip of what Rise brings together; the landing motion drives it. */
export function KeywordMarquee() {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {KEYWORDS.map((keyword) => (
        <li
          key={keyword}
          className="flex items-center gap-10 pr-10 text-[40px] leading-none font-semibold text-brand-950 lg:gap-14 lg:pr-14 lg:text-[72px]"
        >
          {keyword}
          <Asterisk
            data-marquee-icon
            className="size-8 shrink-0 text-brand-400 lg:size-14"
            strokeWidth={2.5}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <section
      data-bg="#FFFFFF"
      aria-label="What Rise Classroom brings together"
      className="overflow-hidden border-y border-neutral-200 bg-white py-8 lg:py-10"
    >
      <div data-marquee-track className="flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
