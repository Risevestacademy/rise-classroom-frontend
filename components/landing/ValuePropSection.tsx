import Image from "next/image";

import { GridRow } from "@/components/landing/GridRow";
import { cn } from "@/lib/utils";

const VALUE_PROPS = [
  {
    body: "Bring learning structure together. Organize cohorts, manage tracks, and connect lessons and resources to students.",
    icon: "/landing/icon-structured.png",
    iconAlt: "Stacked layers icon",
    title: ["Structured", "Learning."],
  },
  {
    body: "Give instructors and students one shared space to teach, learn, access materials, and stay connected.",
    icon: "/landing/icon-connected.png",
    iconAlt: "Three connected people icon",
    title: ["Keep Everyone", "Connected."],
  },
  {
    body: "Make learning progress clear. Track assignments, goals, and feedback so everyone knows what comes next.",
    icon: "/landing/icon-progress.png",
    iconAlt: "Progress pie chart icon",
    title: ["Make progress", "visible."],
  },
];

export function ValuePropSection() {
  return (
    <section data-bg="#FFFFFF">
      <GridRow innerClassName="py-12 lg:px-[18px] lg:pt-[74px] lg:pb-[58px]">
        <p
          data-reveal="up"
          className="max-w-[560px] text-[20px] leading-6 font-medium text-[#1E1E1E]"
        >
          <span className="text-[#8C8C8C]">Learning deserves better systems.</span>{" "}
          Rise Classroom brings people, tools, and learning experiences together
          to make education more connected, structured, and impactful.
        </p>
      </GridRow>

      <GridRow data-value-section>
        <ul data-value-grid className="grid md:grid-cols-3">
          {VALUE_PROPS.map((item, index) => (
            <li
              key={item.icon}
              data-value-card
              className="group border-border-default py-8 not-first:border-t md:py-[25px] md:not-first:border-t-0"
            >
              <div
                className={cn(
                  "md:px-[14px]",
                  index > 0 && "md:border-l md:border-border-default md:px-[20px]",
                )}
              >
                <div className="-mx-3 rounded-[12px] p-3 transition-[background-color,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-hover:bg-brand-50 motion-reduce:transition-none md:mx-0">
                <span
                  data-value-icon
                  className="flex size-[52px] items-center justify-center rounded-[8px] bg-brand-100 transition-[scale,rotate,background-color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-brand-200 motion-reduce:transition-none"
                >
                  <Image
                    src={item.icon}
                    alt={item.iconAlt}
                    width={28}
                    height={28}
                    className="mix-blend-multiply"
                  />
                </span>
                <h3 className="mt-8 text-[20px] leading-[26px] font-semibold text-text-primary md:mt-[84px]">
                  {item.title[0]}
                  <br />
                  {item.title[1]}
                </h3>
                <p className="mt-4 max-w-[210px] text-[14px] leading-5 text-text-secondary">
                  {item.body}
                </p>
                <span
                  aria-hidden
                  className="mt-4 block h-0.5 w-0 bg-brand-400 transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-12 motion-reduce:transition-none"
                />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </GridRow>

      <GridRow innerClassName="py-14 text-center lg:pt-[92px] lg:pb-[70px]">
        <p className="text-[13px] leading-4 font-medium text-[#1E1E1E] uppercase">
          The Rise Classroom advantage
        </p>
        <h2
          data-reveal="lines"
          className="mx-auto mt-4 max-w-[640px] text-[28px] leading-[34px] font-semibold text-text-primary lg:text-[32px] lg:leading-[38px]"
        >
          More time creating meaningful <br className="hidden lg:block" />
          experience.{" "}
          <span className="text-[#8C8C8C]">Less time managing the process.</span>
        </h2>
      </GridRow>
    </section>
  );
}
