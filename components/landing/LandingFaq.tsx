import { Plus } from "lucide-react";

/*
 * Draft answers for the team to confirm. Never put the stipend amount here:
 * it stays a surprise until the first one arrives.
 */
const FAQS = [
  {
    q: "Does it cost anything?",
    a: "No. Rise Academy is free to join, and every student gets a stipend on top.",
  },
  {
    q: "Who can apply?",
    a: "Anyone aged 18 to 28, living in Africa, who wants to become a designer or an engineer and is ready to work hard for twelve months.",
  },
  {
    q: "Do I need experience?",
    a: "You need curiosity and grit more than a CV. Some basics help, and the application will show us where you're starting from.",
  },
  {
    q: "Is it really virtual?",
    a: "Yes. Classes are live and online, so you can join from anywhere with a laptop and a steady internet connection.",
  },
  {
    q: "How much is the stipend?",
    a: "That's the surprise. Every student gets one, and you'll find out how much when the first one arrives.",
  },
  {
    q: "How much time does it take?",
    a: "Treat it like a serious commitment: live classes, weekly tasks and team projects, every week for twelve months.",
  },
  {
    q: "What happens after the twelve months?",
    a: "Three doors: top graduates can be offered a role at Risevest, we introduce graduates to hiring partners, or you build something of your own.",
  },
];

/**
 * Questions people ask before applying, after the story and before the
 * footer. A plain, normal-scrolling section built on native <details>, so it
 * works without JavaScript.
 */
export function LandingFaq() {
  return (
    <section aria-labelledby="faq-title" className="bg-white px-6 py-[112px] sm:px-10 md:px-[6vw] md:py-[160px]">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <h2
            id="faq-title"
            className="text-[clamp(2.4rem,4.4vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.035em] text-neutral-800 md:sticky md:top-[120px]"
          >
            Questions, answered.
          </h2>
        </div>

        <div className="border-t border-neutral-200 md:col-span-7 md:col-start-6">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group border-b border-neutral-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-xl font-bold text-neutral-800 outline-none focus-visible:text-brand-primary md:py-8 md:text-2xl [&::-webkit-details-marker]:hidden">
                {faq.q}
                <Plus
                  aria-hidden
                  className="h-6 w-6 shrink-0 text-brand-primary transition-transform duration-300 group-open:rotate-45"
                />
              </summary>
              <p className="max-w-2xl pb-8 text-base leading-relaxed text-neutral-500 md:text-lg">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
