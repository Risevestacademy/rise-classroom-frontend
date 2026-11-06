import { GridRow } from "@/components/landing/GridRow";

const KEYWORDS = [
  "Cohorts",
  "Curriculum",
  "Assignments",
  "Progress",
  "Community",
  "Feedback",
  "Milestones",
];

/** Endless strip of what Rise brings together, inside the centre column; the landing motion drives it. */
export function KeywordMarquee() {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {KEYWORDS.map((keyword) => (
        <li
          key={keyword}
          className="pr-12 text-[20px] leading-7 font-medium text-text-primary"
        >
          {keyword}
        </li>
      ))}
    </ul>
  );

  return (
    <section data-bg="#FFFFFF" aria-label="What Rise Classroom brings together">
      <GridRow innerClassName="py-12 lg:py-[70px]">
        <div className="overflow-hidden">
          <div data-marquee-track className="flex w-max">
            {row(false)}
            {row(true)}
          </div>
        </div>
      </GridRow>
    </section>
  );
}
