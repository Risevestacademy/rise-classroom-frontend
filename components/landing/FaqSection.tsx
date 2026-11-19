import { FaqAccordion } from "@/components/landing/FaqAccordion";
import { RiseMark } from "@/components/landing/RiseMark";

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
    <section id="faq" data-bg="#FFFFFF" className="px-4 py-19 lg:py-[128px]">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-12 lg:flex-row lg:justify-between lg:gap-14">
        <div className="lg:sticky lg:top-20 lg:w-[380px] lg:self-start">
          <RiseMark />
          <h2
            data-reveal="lines"
            className="mt-6 text-[36px] leading-[1.08] font-black tracking-[-0.035em] text-brand-950 lg:text-[52px]"
          >
            Frequently asked questions
          </h2>
          <p className="mt-5 text-[16px] leading-7 text-text-secondary">
            Still curious?{" "}
            <a
              href="mailto:contact@riseclassroom.com"
              className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
            >
              Write to us
            </a>
          </p>
        </div>

        <FaqAccordion items={FAQS} />
      </div>
    </section>
  );
}
