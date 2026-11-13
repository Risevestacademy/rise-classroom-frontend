import Image from "next/image";
import Link from "next/link";
import { Asterisk } from "lucide-react";

import { GridRow } from "@/components/landing/GridRow";
import { RollText } from "@/components/landing/RollText";
import { cn } from "@/lib/utils";

const AUDIENCES = [
  {
    id: "organizations",
    label: "FOR ORGANIZATIONS",
    points: [
      "Manage multiple cohorts",
      "Organize curriculum and tracks",
      "Monitor progress and outcomes",
      "Work with instructors and mentors",
    ],
  },
  {
    id: "instructors",
    label: "FOR INSTRUCTORS",
    points: [
      "Create and manage classes",
      "Share learning resources",
      "Track learner progress",
      "Connect with students",
    ],
  },
];

function Audience({
  audience,
  className,
}: {
  audience: (typeof AUDIENCES)[number];
  className?: string;
}) {
  return (
    <div
      data-solution-card
      data-audience={audience.id}
      className={cn("group/audience flex flex-col justify-center px-5 py-10", className)}
    >
      <p
        data-solution-text
        className="font-tomato text-[14px] leading-5 font-medium text-brand-950 transition-[translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/audience:translate-x-1.5 motion-reduce:transition-none"
      >
        {audience.label}
      </p>
      <ul className="mt-6 flex flex-col gap-1">
        {audience.points.map((point) => (
          <li
            key={point}
            data-solution-point
            className="flex min-h-6 items-center gap-2"
          >
            <Asterisk
              className="size-4 shrink-0 text-text-disabled transition-[rotate,color] duration-500 group-hover/audience:rotate-90 group-hover/audience:text-brand-400 motion-reduce:transition-none"
              strokeWidth={2}
            />
            <span className="text-[14px] leading-5 text-text-secondary">
              {point}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SolutionSection() {
  const [organizations, instructors] = AUDIENCES;

  return (
    <section id="solutions" data-bg="#FFFFFF">
      <GridRow innerClassName="py-12 lg:px-3 lg:pt-[56px] lg:pb-[58px]">
        <h2
          data-reveal="up"
          className="text-[20px] leading-7 font-bold text-black"
        >
          Built for those who make learning happen.
        </h2>
        <p
          data-reveal="up"
          className="mt-1 max-w-[480px] text-[20px] leading-[26px] text-[#8C8C8C]"
        >
          Rise classroom brings organized learning to academies and independent
          instructors.
        </p>
      </GridRow>

      {/* Hovering an audience shows its photo; organizations is the default. */}
      <GridRow
        className="px-0"
        innerClassName="group/audiences grid lg:grid-cols-[280fr_266fr_254fr]"
      >
        <Audience audience={organizations} className="bg-brand-100" />

        <div className="flex flex-col lg:border-x lg:border-border-default">
          <div data-solution-media className="relative overflow-hidden">
            <Image
              src="/landing/solution-organizations.jpg"
              alt="Students collaborating on laptops in a classroom"
              width={762}
              height={508}
              className="aspect-[266/275] w-full object-cover"
            />
            <Image
              src="/landing/solution-instructors.jpg"
              alt="An instructor planning lessons at her laptop"
              width={762}
              height={508}
              className="absolute inset-0 size-full scale-105 object-cover opacity-0 transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-has-[[data-audience=instructors]:hover]/audiences:scale-100 group-has-[[data-audience=instructors]:hover]/audiences:opacity-100 motion-reduce:transition-none"
            />
          </div>
          <div className="flex flex-1 items-center justify-center py-8">
            <Link
              href="#product"
              data-magnetic
              className="landing-btn inline-flex h-[54px] items-center font-tomato rounded-full bg-brand-950 px-8 text-[14px] leading-5 font-medium text-white ring-2 ring-brand-200"
            >
              <RollText>Explore the platform</RollText>
            </Link>
          </div>
        </div>

        <Audience audience={instructors} />
      </GridRow>
    </section>
  );
}
