import Image from "next/image";
import Link from "next/link";
import { Asterisk } from "lucide-react";

import { RollText } from "@/components/landing/RollText";

const AUDIENCES = [
  {
    label: "FOR ORGANIZATIONS",
    title: ["Bring your learning", "programs together"],
    image: "/landing/solution-organizations.jpg",
    imageAlt: "Students collaborating on laptops in a classroom",
    points: [
      "Manage multiple cohorts",
      "Organize curriculum and tracks",
      "Monitor progress and outcomes",
      "Work with instructors and mentors",
    ],
  },
  {
    label: "FOR INDIVIDUAL INSTRUCTORS",
    title: ["Make teaching", "easier to manage."],
    image: "/landing/solution-instructors.jpg",
    imageAlt: "An instructor planning lessons at her laptop",
    points: [
      "Create and manage your classes",
      "Share learning resources",
      "Track learner progress",
      "Communicate with your students",
    ],
  },
];

export function SolutionSection() {
  return (
    <section
      id="solutions"
      data-bg="#FFFFFF"
      className="bg-white px-4 pt-[72px] pb-[72px] lg:pt-[100px] lg:pb-[100px]"
    >
      <div className="mx-auto flex w-full max-w-[1004px] flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-0">
        <div className="lg:sticky lg:top-[180px] lg:mt-[143px] lg:w-[511px]">
          <h2
            data-reveal="lines"
            className="text-[32px] leading-[40px] font-bold text-text-primary lg:text-[48px] lg:leading-[56px]"
          >
            A better way to bring <em className="italic">learning together.</em>
          </h2>
          <p
            data-reveal="up"
            className="mt-[18px] max-w-[367px] text-[16px] leading-6 font-medium text-text-secondary"
          >
            Whether you&apos;re running an academy or teaching independently,
            Rise Classroom helps you bring learning into one organized space.
          </p>
          <Link
            href="#product"
            data-magnetic
            className="landing-btn mt-[33px] inline-flex h-[54px] items-center rounded-full bg-brand-950 px-8 text-[14px] leading-5 font-medium text-white ring-2 ring-brand-200"
          >
            <RollText>Explore the platform</RollText>
          </Link>
        </div>

        <ul className="flex flex-col gap-12 lg:w-[413px]">
          {AUDIENCES.map((audience) => (
            <li
              key={audience.label}
              data-solution-card
              className="rounded-[24px] bg-neutral-100 p-4"
            >
              <div
                data-solution-media
                className="overflow-hidden rounded-[16px]"
              >
                <Image
                  src={audience.image}
                  alt={audience.imageAlt}
                  width={381}
                  height={254}
                  className="h-auto w-full"
                />
              </div>
              <p
                data-solution-text
                className="mt-3 text-[14px] leading-5 font-medium text-brand-950"
              >
                {audience.label}
              </p>
              <h3
                data-solution-text
                className="mt-3 text-[20px] leading-7 font-semibold text-black"
              >
                {audience.title[0]}
                <br />
                {audience.title[1]}
              </h3>
              <ul className="mt-2 flex flex-col gap-2">
                {audience.points.map((point) => (
                  <li
                    key={point}
                    data-solution-point
                    className="flex h-6 items-center gap-2"
                  >
                    <Asterisk
                      className="size-4 shrink-0 text-text-secondary"
                      strokeWidth={2}
                    />
                    <span className="font-work text-[14px] leading-5 text-text-secondary">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
