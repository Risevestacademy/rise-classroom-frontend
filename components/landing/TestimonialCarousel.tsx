"use client";

import { useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  EASE_OUT,
  gsap,
  MEDIA,
  ScrollTrigger,
  SplitText,
  useGSAP,
} from "@/components/landing/motion/gsap";
import { cn } from "@/lib/utils";

type Photo = {
  src: string;
  width: number;
  height: number;
  /** Face centre (x, y) and face width, as fractions of the photo. */
  face: { x: number; y: number; w: number };
};

const TESTIMONIALS: {
  title: string;
  quote: string;
  name: string;
  role: string;
  photo: Photo;
}[] = [
  {
    title: "Teaching feels more organized and less stressful.",
    quote:
      "I can focus more on teaching and spend less time trying to keep everything organized.",
    name: "Rihannat Oyiza",
    role: "Product Design Instructor",
    photo: {
      src: "/landing/testimonial/rihannat-oyiza.jpg",
      width: 736,
      height: 981,
      face: { x: 0.5, y: 0.46, w: 0.33 },
    },
  },
  {
    title: "Everything I need in one place.",
    quote:
      "Having my lessons, assignments, and learning resources organized makes it easier to know what to work on next.",
    name: "Oluwafemi Banks",
    role: "Frontend Engineering Student",
    photo: {
      src: "/landing/testimonial/oluwafemi-banks.jpg",
      width: 1060,
      height: 1484,
      face: { x: 0.505, y: 0.44, w: 0.41 },
    },
  },
  {
    title: "A clearer view of our learning programs.",
    quote:
      "Rise Classroom gives us a clear overview of our cohorts, instructors, and student progress.",
    name: "Chioma Adeyemi",
    role: "Program Administrator",
    photo: {
      src: "/landing/testimonial/chioma-adeyemi.jpg",
      width: 736,
      height: 1308,
      face: { x: 0.387, y: 0.413, w: 0.23 },
    },
  },
  {
    title: "It helps us run better programs.",
    quote:
      "We can easily manage multiple cohorts, organize curriculum, and track outcomes — all in one platform.",
    name: "Tunde Lawal",
    role: "Learning Lead, SkillForge",
    photo: {
      src: "/landing/testimonial/tunde-lawal.jpg",
      width: 900,
      height: 1200,
      face: { x: 0.555, y: 0.45, w: 0.37 },
    },
  },
  {
    title: "It makes supporting students more meaningful.",
    quote:
      "It's easier to track progress, give feedback, and have focused mentor sessions.",
    name: "Ifeoma Nwosu",
    role: "Mentor, Rise Academy",
    photo: {
      src: "/landing/testimonial/ifeoma-nwosu.jpg",
      width: 1200,
      height: 1497,
      face: { x: 0.49, y: 0.36, w: 0.31 },
    },
  },
];
const COUNT = TESTIMONIALS.length;
const AUTO_ADVANCE_SECONDS = 7;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Where each card in the photo stack sits, by depth (0 is the front). Cards
 * deeper than the last slot wait, hidden, behind it.
 */
const SLOTS = [
  { x: 0, y: 0, rotation: 0, scale: 1 },
  { x: -28, y: 0, rotation: -5.4, scale: 0.93 },
  { x: 24, y: -5, rotation: 5.4, scale: 0.93 },
  { x: 53, y: 2, rotation: 10.6, scale: 0.86 },
];
/** Where the front card is thrown to when it goes to the back of the stack. */
const THROWN = { x: -180, y: -40, rotation: -14, scale: 0.9 };

const slotFor = (depth: number) => SLOTS[Math.min(depth, SLOTS.length - 1)];
const depthOf = (index: number, active: number) =>
  (index - active + COUNT) % COUNT;

/** Crops the photo to the face, sized for a `size`px round avatar. */
function FaceAvatar({ photo, size }: { photo: Photo; size: number }) {
  const { face } = photo;
  // Scale so the face fills ~60% of the circle, without leaving gaps.
  const width = Math.max(
    size,
    (size * 0.6) / face.w,
    (size * photo.width) / photo.height
  );
  const height = (width * photo.height) / photo.width;
  const clamp = (offset: number, length: number) =>
    Math.min(0, Math.max(size - length, offset));
  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <Image
        src={photo.src}
        alt=""
        width={Math.round(width)}
        height={Math.round(height)}
        className="absolute max-w-none"
        style={{
          width,
          height,
          left: clamp(size / 2 - face.x * width, width),
          top: clamp(size / 2 - face.y * height, height),
        }}
      />
    </span>
  );
}

/**
 * Testimonials as a stack of photo cards. Moving on throws the front card to
 * the back of the stack while the quote swaps line by line. It advances on a
 * timer while in view (paused on hover), and the stack can be swiped.
 */
export function TestimonialCarousel() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const previous = useRef<number | null>(null);
  const timer = useRef<gsap.core.Tween | null>(null);
  const hovered = useRef(false);
  const inView = useRef(false);
  const swipeStart = useRef<number | null>(null);
  const titleSplit = useRef<SplitText | null>(null);

  const go = (step: 1 | -1) => {
    const next = (activeRef.current + step + COUNT) % COUNT;
    previous.current = activeRef.current;
    activeRef.current = next;
    setActive(next);
  };

  const syncTimer = () => {
    if (hovered.current || !inView.current) timer.current?.pause();
    else timer.current?.resume();
  };

  // Only run the timer while the section is on screen.
  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          inView.current = self.isActive;
          syncTimer();
        },
      });
    },
    { scope: root }
  );

  useGSAP(
    () => {
      const from = previous.current;
      const animate = from !== null && window.matchMedia(MEDIA.motion).matches;
      const forward = from !== null && depthOf(from, active) === COUNT - 1;

      // The photo stack.
      gsap.utils.toArray<HTMLElement>("[data-deck-card]").forEach((card, i) => {
        const depth = depthOf(i, active);
        const slot = {
          ...slotFor(depth),
          autoAlpha: depth < SLOTS.length ? 1 : 0,
        };
        gsap.killTweensOf(card);

        if (!animate) {
          gsap.set(card, { ...slot, zIndex: COUNT - depth });
          return;
        }

        if (forward && i === from) {
          // Throw the old front card off, then tuck it in at the back.
          gsap
            .timeline()
            .set(card, { zIndex: COUNT + 1 })
            .to(card, {
              ...THROWN,
              autoAlpha: 0,
              duration: 0.5,
              ease: "power2.in",
            })
            .set(card, { ...slot, zIndex: COUNT - depth });
          return;
        }

        if (!forward && depth === 0) {
          // Going back: pull the hidden back card out and onto the front.
          gsap.set(card, { zIndex: COUNT + 1 });
          gsap.fromTo(
            card,
            { ...THROWN, autoAlpha: 0 },
            { ...slot, duration: 0.9, ease: EASE_OUT }
          );
          return;
        }

        gsap.set(card, { zIndex: COUNT - depth });
        gsap.to(card, {
          ...slot,
          duration: 0.9,
          delay: forward ? 0.15 : 0,
          ease: EASE_OUT,
        });
      });

      // The quote.
      const panels = gsap.utils.toArray<HTMLElement>("[data-quote]");
      panels.forEach((panel, i) => {
        if (i !== active && i !== from) gsap.set(panel, { autoAlpha: 0 });
      });
      const incoming = panels[active];
      const incomingParts = incoming.querySelectorAll("[data-quote-part]");
      // Clicking quickly can land back on a quote that is still animating out.
      titleSplit.current?.revert();
      gsap.killTweensOf([incoming, ...incomingParts]);
      gsap.set(incomingParts, { clearProps: "transform,opacity,visibility" });
      gsap.set(incoming, { autoAlpha: 1 });

      if (animate) {
        const outgoing = panels[from];
        gsap
          .timeline()
          .to(outgoing.querySelectorAll("[data-quote-part]"), {
            y: -16,
            autoAlpha: 0,
            duration: 0.35,
            stagger: 0.04,
            ease: "power2.in",
          })
          .set(outgoing, { autoAlpha: 0 })
          .set(outgoing.querySelectorAll("[data-quote-part]"), {
            clearProps: "transform,opacity,visibility",
          });

        const title = incoming.querySelector("[data-quote-title]");
        const split = SplitText.create(title, { type: "lines", mask: "lines" });
        titleSplit.current = split;
        gsap
          .timeline({ delay: 0.3, onComplete: () => split.revert() })
          .from(split.lines, {
            yPercent: 110,
            duration: 1,
            stagger: 0.08,
            ease: EASE_OUT,
          })
          .from(
            incoming.querySelectorAll(
              "[data-quote-part]:not([data-quote-title])"
            ),
            {
              y: 24,
              autoAlpha: 0,
              duration: 0.9,
              stagger: 0.08,
              ease: EASE_OUT,
            },
            0.1
          );

        gsap.fromTo(
          "[data-quote-count]",
          { yPercent: forward ? 100 : -100 },
          { yPercent: 0, duration: 0.7, ease: EASE_OUT }
        );
      }

      // The timer, shown as the divider line filling up.
      timer.current?.kill();
      timer.current = null;
      if (!window.matchMedia(MEDIA.motion).matches) return;
      timer.current = gsap.fromTo(
        "[data-quote-progress]",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: AUTO_ADVANCE_SECONDS,
          ease: "none",
          onComplete: () => go(1),
        }
      );
      syncTimer();
    },
    { scope: root, dependencies: [active] }
  );

  const onPointerDown = (event: PointerEvent) => {
    swipeStart.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (swipeStart.current === null) return;
    const dx = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label="Testimonials"
      onPointerEnter={() => {
        hovered.current = true;
        syncTimer();
      }}
      onPointerLeave={() => {
        hovered.current = false;
        syncTimer();
      }}
      className="mt-[44px] flex flex-col items-center gap-12 overflow-hidden rounded-[32px] bg-[#ededed] px-6 py-10 lg:h-[528px] lg:flex-row lg:justify-between lg:gap-0 lg:py-0 lg:pr-[104px] lg:pl-[40px]"
    >
      <div className="w-full lg:w-[486px]">
        <div className="flex items-center gap-[17px]">
          <p className="flex shrink-0 text-[16px] leading-5 text-text-primary">
            <span className="overflow-hidden">
              <span data-quote-count className="block">
                {pad(active + 1)}
              </span>
            </span>
            <span className="text-text-disabled">&nbsp;/ {pad(COUNT)}</span>
          </p>
          <span
            aria-hidden
            className="relative h-px w-full max-w-[304px] bg-[#dce1e1]"
          >
            <span
              data-quote-progress
              className="absolute inset-0 origin-left scale-x-0 bg-text-primary motion-reduce:hidden"
            />
          </span>
        </div>

        {/* Every quote is stacked in the same cell so the height never jumps. */}
        <div className="mt-[31px] grid">
          {TESTIMONIALS.map((item, index) => (
            <div
              key={item.name}
              data-quote
              aria-hidden={index !== active}
              className={cn(
                "col-start-1 row-start-1",
                index !== 0 && "invisible"
              )}
            >
              <h3
                data-quote-part
                data-quote-title
                className="text-[28px] leading-9 font-medium text-text-primary lg:text-[32px] lg:leading-10"
              >
                {item.title}
              </h3>
              <blockquote
                data-quote-part
                className="mt-[12px] font-work text-[16px] leading-6 tracking-[0.04em] text-text-primary italic lg:text-[18px] lg:leading-7"
              >
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <div
                data-quote-part
                className="mt-[37px] flex items-center gap-4"
              >
                <FaceAvatar photo={item.photo} size={44} />
                <div className="text-[14px] leading-5">
                  <p className="font-medium text-text-primary">{item.name}</p>
                  <p className="text-text-secondary">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[32px] flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={() => go(-1)}
            className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-text-primary transition-transform active:scale-90"
          >
            <ChevronLeft className="size-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={() => go(1)}
            className="flex size-10 items-center justify-center rounded-full bg-brand-900 text-white transition-transform active:scale-90"
          >
            <ChevronRight className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeStart.current = null)}
        className="relative h-[320px] w-[240px] shrink-0 touch-pan-y select-none sm:h-[403px] sm:w-[302px]"
      >
        {TESTIMONIALS.map((item, index) => {
          const depth = depthOf(index, 0);
          const slot = slotFor(depth);
          return (
            <div
              key={item.name}
              data-deck-card
              aria-hidden={index !== active}
              // Server-rendered starting position; GSAP takes over from here.
              style={{
                transform: `translate(${slot.x}px, ${slot.y}px) rotate(${slot.rotation}deg) scale(${slot.scale})`,
                zIndex: COUNT - depth,
                visibility: depth < SLOTS.length ? undefined : "hidden",
              }}
              className={cn(
                "absolute inset-0 overflow-hidden rounded-[24px] border-[6px] bg-[#232220] transition-colors duration-500",
                index === active ? "border-white" : "border-neutral-200"
              )}
            >
              <Image
                src={item.photo.src}
                alt={index === active ? `Portrait of ${item.name}` : ""}
                fill
                sizes="(min-width: 640px) 302px, 240px"
                draggable={false}
                className="rounded-[18px] object-cover"
                style={{ objectPosition: `50% ${item.photo.face.y * 100}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
