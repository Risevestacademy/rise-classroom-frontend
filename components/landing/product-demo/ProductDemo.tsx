"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { gsap, MEDIA, ScrollTrigger, useGSAP } from "@/components/landing/motion/gsap";
import { cn } from "@/lib/utils";

import { createDirector } from "./director";
import { LAYOUT_SIZE, LayoutProvider } from "./kit";
import { ROLES } from "./roles";

type Device = "laptop" | "tablet" | "phone";

const PHONE = "(max-width: 639px)";
const TABLET = "(min-width: 640px) and (max-width: 1023px)";

function subscribeDevice(onChange: () => void) {
  const queries = [PHONE, TABLET].map((query) => window.matchMedia(query));
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => queries.forEach((query) => query.removeEventListener("change", onChange));
}

function currentDevice(): Device {
  if (window.matchMedia(PHONE).matches) return "phone";
  if (window.matchMedia(TABLET).matches) return "tablet";
  return "laptop";
}

/**
 * Widths that fit each device to the screen's height. The laptop is about
 * 0.67 of its width tall and fills the height; tablet and phone leave room
 * for the tabs underneath. The laptop's base overhangs by 5% a side.
 */
const DEVICE_WIDTH: Record<Device, string> = {
  laptop: "min(1500px, calc(100% / 1.1), calc((100svh - 3rem) * 1.48))",
  tablet: "min(100%, calc((100svh - 9rem) * 1.52))",
  phone: "min(100%, 380px, calc((100svh - 9rem) * 0.48))",
};

/**
 * A device playing a scripted walk through the app, one role at a time: a
 * laptop on desktops, a tablet on tablets and the phone layout on phones.
 */
export function ProductDemo() {
  const root = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const app = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  const timeline = useRef<gsap.core.Timeline | null>(null);
  const play = useRef(() => {});
  const inView = useRef(false);

  const device = useSyncExternalStore(subscribeDevice, currentDevice, () => "laptop" as const);
  const layout = device === "phone" ? "phone" : "desktop";
  const size = LAYOUT_SIZE[layout];

  // Bumping count remounts the app, so a role always starts from its first frame.
  const [run, setRun] = useState({ index: 0, count: 0 });
  const role = ROLES[run.index];
  const { App } = role;

  useEffect(() => {
    const el = screen.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      el.style.setProperty("--k", String(entry.contentRect.width / size.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [size.width, device]);

  // Slide the dark pill under the active tab (phones and tablets).
  useLayoutEffect(() => {
    const list = tabs.current;
    const pill = indicator.current;
    if (!list || !pill) return;
    const place = () => {
      const tab = list.querySelector<HTMLElement>(`[data-role="${role.id}"]`);
      if (!tab) return;
      pill.style.width = `${tab.offsetWidth}px`;
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [role.id, device]);

  // Open the lid on the way in, and only play while the device is in view.
  useGSAP(
    () => {
      const track = root.current!.closest<HTMLElement>("[data-tour-track]") ?? root.current!;
      const lid = root.current!.querySelector("[data-demo-lid]");
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        if (lid) {
          gsap.fromTo(
            lid,
            { rotationX: -88, transformPerspective: 2400 },
            {
              rotationX: 0,
              ease: "none",
              scrollTrigger: { trigger: track, start: "top 75%", end: "top top", scrub: 0.6 },
            },
          );
        }

        ScrollTrigger.create({
          trigger: track,
          start: "top 30%",
          end: "bottom 70%",
          onToggle: (self) => {
            inView.current = self.isActive;
            if (self.isActive) play.current();
            else timeline.current?.pause();
          },
        });

        return () => {
          inView.current = false;
        };
      });
    },
    { dependencies: [device], scope: root, revertOnUpdate: true },
  );

  // The walkthrough for the current role, built the first time it's seen.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        const wake = run.count > 0;
        play.current = () => {
          if (!timeline.current) {
            const director = createDirector(app.current!, camera.current!, wake);
            role.script(director);
            const tl = director.tl;
            tl.eventCallback("onUpdate", () => {
              if (fill.current) gsap.set(fill.current, { scaleX: tl.progress() });
            });
            tl.eventCallback("onComplete", () =>
              setRun((current) => ({
                index: (current.index + 1) % ROLES.length,
                count: current.count + 1,
              })),
            );
            timeline.current = tl;
          }
          timeline.current.play();
        };
        if (inView.current) play.current();

        return () => {
          timeline.current?.kill();
          timeline.current = null;
          play.current = () => {};
          if (fill.current) gsap.set(fill.current, { scaleX: 0 });
          if (camera.current) gsap.set(camera.current, { x: 0, y: 0, scale: 1 });
        };
      });
    },
    { dependencies: [run, device], scope: root, revertOnUpdate: true },
  );

  const choose = (index: number) => {
    const next = () => setRun((current) => ({ index, count: current.count + 1 }));
    if (!timeline.current) return next();
    timeline.current.pause();
    gsap.to(app.current, { autoAlpha: 0, duration: 0.25, ease: "power1.in", onComplete: next });
  };

  const display = (
    <div
      ref={screen}
      aria-hidden
      className={cn(
        "relative overflow-hidden bg-[#0c0c10]",
        device === "laptop" && "rounded-[3px]",
        device === "tablet" && "rounded-[clamp(6px,1.4vw,14px)]",
        device === "phone" && "rounded-[13%/6%]",
      )}
      style={{ aspectRatio: `${size.width} / ${size.height}` }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: size.width, height: size.height, transform: "scale(var(--k, 0))" }}
      >
        <div ref={camera} className="origin-top-left">
          <LayoutProvider value={layout}>
            <div ref={app} key={`${role.id}-${device}-${run.count}`}>
              <App />
            </div>
          </LayoutProvider>
        </div>
      </div>
      {device === "phone" && (
        <span className="absolute top-[1.6%] left-1/2 h-[3.6%] w-[31%] -translate-x-1/2 rounded-full bg-black" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.07)_0%,transparent_38%)]" />
    </div>
  );

  const frame =
    device === "laptop" ? (
      <div className="relative">
        <div
          data-demo-lid
          className="relative origin-bottom rounded-t-[clamp(10px,1.6vw,24px)] bg-[#0c0c10] p-[1.6%] pb-[2.4%] shadow-[0_0_0_1.5px_#c4c6cc,0_40px_80px_-30px_rgb(8_13_56/0.35)] [backface-visibility:hidden]"
        >
          <span className="absolute top-[0.6%] left-1/2 size-[0.5%] -translate-x-1/2 rounded-full bg-[#2a2b31]" />
          {display}
        </div>
        <div className="relative -mx-[5%]">
          <div className="relative aspect-[1000/18] rounded-t-[3px] rounded-b-[12%_100%] bg-[linear-gradient(180deg,#f1f2f4_0%,#d9dade_45%,#a9abb2_100%)] shadow-[inset_0_1px_0_#ffffff]">
            <span className="absolute top-0 left-1/2 h-[45%] w-[13%] -translate-x-1/2 rounded-b-[10px] bg-[linear-gradient(180deg,#c5c7cc,#dcdde1)]" />
          </div>
          <span className="absolute inset-x-[6%] -bottom-8 -z-10 h-12 rounded-[50%] bg-brand-950/25 blur-2xl" />
        </div>
      </div>
    ) : (
      <div
        className={cn(
          "relative bg-[#0c0c10] shadow-[0_0_0_1.5px_#c4c6cc,0_30px_70px_-30px_rgb(8_13_56/0.45)]",
          device === "tablet" ? "rounded-[clamp(16px,3.2vw,32px)] p-[2.4%]" : "rounded-[15%/7%] p-[3.5%]",
        )}
      >
        {device === "tablet" && (
          <span className="absolute top-[1.1%] left-1/2 size-[0.7%] -translate-x-1/2 rounded-full bg-[#2a2b31]" />
        )}
        {display}
      </div>
    );

  return (
    <div
      ref={root}
      className={cn(
        "flex w-full items-center justify-center",
        device === "laptop" ? "h-full gap-6 xl:gap-12" : "flex-col",
      )}
    >
      {device === "laptop" && (
        <div role="tablist" aria-orientation="vertical" aria-label="See Rise Classroom as" className="w-48 shrink-0 xl:w-56">
          <p className="mb-4 px-4 text-xs font-medium tracking-wider text-[#8C8C8C] uppercase">See it as</p>
          <div className="space-y-2">
            {ROLES.map((item, index) => {
              const active = index === run.index;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => choose(index)}
                  className={cn(
                    "block w-full rounded-2xl px-4 py-3.5 text-left transition-[background-color,box-shadow] duration-300",
                    active
                      ? "bg-white shadow-[0_14px_34px_-20px_rgb(8_13_56/0.5)] ring-1 ring-neutral-200/80"
                      : "hover:bg-white/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center gap-3 font-tomato text-[20px] leading-7 font-bold transition-colors duration-300",
                      active ? "text-black" : "text-[#B5B5B5]",
                    )}
                  >
                    <item.icon className="size-5" />
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      active ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <span className="overflow-hidden">
                      <span className="block pt-1.5 font-tomato text-[15px] leading-5 text-[#8C8C8C]">
                        {item.caption}
                      </span>
                      <span className="mt-3 block h-[3px] overflow-hidden rounded-full bg-neutral-200">
                        {active && (
                          <span
                            ref={fill}
                            className="block h-full origin-left rounded-full bg-brand-primary"
                            style={{ transform: "scaleX(0)" }}
                          />
                        )}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={cn("flex justify-center", device === "laptop" ? "min-w-0 flex-1" : "w-full")}>
        <div role="img" aria-label={role.description} style={{ width: DEVICE_WIDTH[device] }}>
          {frame}
        </div>
      </div>

      {device !== "laptop" && (
        <>
          <div
            ref={tabs}
            role="tablist"
            aria-label="See Rise Classroom as"
            className="relative z-10 mt-6 flex rounded-full border border-neutral-200/80 bg-white/80 p-1 shadow-[0_14px_34px_-16px_rgb(8_13_56/0.45)] backdrop-blur-md"
          >
            <span
              ref={indicator}
              aria-hidden
              className="absolute top-1 bottom-1 left-0 overflow-hidden rounded-full bg-brand-primary transition-[transform,width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              <span
                ref={fill}
                className="absolute inset-0 origin-left bg-white/15"
                style={{ transform: "scaleX(0)" }}
              />
            </span>
            {ROLES.map((item, index) => {
              const active = index === run.index;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  data-role={item.id}
                  aria-selected={active}
                  onClick={() => choose(index)}
                  className={cn(
                    "relative flex h-10 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors duration-300 sm:px-4 sm:text-sm",
                    active ? "text-white" : "text-neutral-500 hover:text-neutral-800",
                  )}
                >
                  <item.icon className="hidden size-4 sm:block" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <p
            key={role.id}
            aria-live="polite"
            className="mt-3 animate-in px-4 text-center font-tomato text-[15px] leading-5 text-[#8C8C8C] duration-500 fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
          >
            {role.caption}
          </p>
        </>
      )}
    </div>
  );
}
