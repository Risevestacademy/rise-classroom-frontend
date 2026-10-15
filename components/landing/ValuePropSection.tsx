import Image from "next/image";

const VALUE_PROPS = [
  {
    body: "Bring your learning structure into one place. Organize cohorts, manage tracks, and keep lessons and learning resources connected to the right students.",
    icon: "/landing/icon-structured.png",
    title: ["Structured", "Learning."],
  },
  {
    body: "Give instructors and students a shared space to learn, teach, access materials, and stay connected throughout the learning experience.",
    icon: "/landing/icon-connected.png",
    title: ["Keep everyone", "connected."],
  },
  {
    body: "Make learning progress easier to understand. Follow assignments, goals, feedback, and milestones so learners and educators know what needs attention next.",
    icon: "/landing/icon-progress.png",
    title: ["Make progress", "visible."],
  },
];

export function ValuePropSection() {
  return (
    <section className="flex flex-col items-center bg-brand-800 px-4 pt-[100px] pb-[84px]">
      <h2
        data-reveal="words"
        className="w-full max-w-[740px] text-center text-[48px] leading-[56px] font-bold text-white"
      >
        Everything works better when it{" "}
        <em className="italic">works together</em>.
      </h2>
      <p
        data-reveal="up"
        className="mt-[8px] w-full max-w-[501px] text-center text-[16px] leading-6 font-medium text-text-disabled"
      >
        From organizing classes to delivering lessons and tracking progress,
        bring the moving parts of learning into one connected space.
      </p>

      <ul
        data-value-grid
        className="relative mt-[80px] grid w-full max-w-[1080px] gap-3 md:grid-cols-3"
      >
        {VALUE_PROPS.map((item) => (
          <li
            key={item.icon}
            data-value-card
            className="group relative flex h-[472px] transition-[translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 motion-reduce:transition-none flex-col justify-between rounded-[28px] bg-neutral-100 px-6 py-8"
          >
            <p className="font-work text-[14px] leading-5 font-medium text-text-secondary">
              {item.body}
            </p>
            <Image
              src={item.icon}
              alt=""
              data-value-icon
              width={96}
              height={96}
              className="mx-auto transition-[rotate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-6 motion-reduce:transition-none"
            />
            <h3 className="text-[24px] leading-8 font-semibold text-text-primary">
              {item.title[0]}
              <br />
              {item.title[1]}
            </h3>
          </li>
        ))}
      </ul>
    </section>
  );
}
