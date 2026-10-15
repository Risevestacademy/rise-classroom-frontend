import { FaqAccordion } from "@/components/landing/FaqAccordion";

const FAQS = [
  {
    question: "What is Rise Classroom?",
    answer:
      "Rise Classroom is a learning management platform that helps instructors and learning organizations organize classes, curriculum, learning materials, assignments, and student progress in one connected space.",
  },
  {
    question: "Who can use Rise Classroom?",
    answer:
      "Rise Classroom is designed for individual instructors, academies, schools, and organizations that deliver structured learning programs.",
  },
  {
    question: "Is Rise Classroom free to use?",
    answer:
      "Rise Classroom is designed to offer a free starting option. Details about available features, usage limits, and future paid plans will be provided as the platform's pricing develops.",
  },
  {
    question: "Can I use Rise Classroom for my academy or organization?",
    answer:
      "Yes. Rise Classroom is designed to help organizations manage learning programs, organize cohorts and tracks, coordinate instructors, and monitor student progress.",
  },
  {
    question: "Can I track student progress?",
    answer:
      "Rise Classroom includes a focus on making student progress more visible. Instructors and administrators can use the platform's supported progress-tracking tools to understand how learners are doing.",
  },
  {
    question: "How do I get started with Rise Classroom?",
    answer:
      "Select Start for free on the website and follow the signup process. You'll be able to explore the options available for your learning setup.",
  },
];

export function FaqSection() {
  return (
    <section
      data-bg="#F5F6FF"
      className="bg-brand-50 px-4 pt-[72px] pb-[44px] lg:pt-[100px]"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 lg:flex-row lg:justify-between lg:gap-0">
        <div className="lg:w-[328px]">
          <h2
            data-reveal="words"
            className="text-[32px] leading-[40px] font-semibold text-text-primary lg:text-[40px] lg:leading-[48px]"
          >
            Totally fair to ask.
          </h2>
          <p
            data-reveal="up"
            className="mt-[12px] max-w-[322px] text-[16px] leading-6 font-medium text-text-secondary"
          >
            Everything you need to know about getting started with Rise
            Classroom
          </p>
        </div>

        <FaqAccordion items={FAQS} />
      </div>
    </section>
  );
}
