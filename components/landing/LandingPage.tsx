"use client";

import "lenis/dist/lenis.css";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowRight } from "lucide-react";

import { Logo } from "@/assets/logo";
import { Button } from "@/components/ui/button";
import { StackGame } from "@/components/home/StackGame";
import { admissionsQuery } from "@/lib/admissions";
import { landingPathFor } from "@/lib/auth";
import { easeInOutSine, ramp } from "@/lib/landing-timeline";
import { cn } from "@/lib/utils";
import { sessionQuery } from "@/lib/session-query";

import { ApplicationCopy } from "./ApplicationCopy";
import { LandingFooter } from "./LandingFooter";
import { RevealTitle } from "./RevealTitle";
import { SPANS, createScene, storyPosition } from "./scene";
import { CHAPTERS, TOTAL_SCREENS, type Chapter, type ChapterId, type CopyAlign } from "./story";

/** Three clicks on the logo inside this window open the hidden game. */
const TRIPLE_CLICK_MS = 600;

const STIPEND = CHAPTERS.findIndex((chapter) => chapter.id === "stipend");

/** Where each chapter's copy sits. Phones always get it at the bottom. */
const ALIGN: Record<CopyAlign, string> = {
  left: "md:right-auto md:bottom-auto md:left-[6vw] md:top-1/2 md:w-[38vw] md:-translate-y-1/2",
  right: "md:left-auto md:bottom-auto md:right-[7vw] md:top-1/2 md:w-[36vw] md:-translate-y-1/2",
  top: "md:right-[8vw] md:left-[8vw] md:bottom-auto md:top-[13vh] md:mx-auto md:max-w-[56rem] md:text-center",
  bottom: "md:right-[8vw] md:left-[8vw] md:bottom-[7vh] md:mx-auto md:max-w-[60rem] md:text-center",
};

/** The hero gets more room: the mark sits right, the promise left. */
const HERO_ALIGN = "md:right-auto md:bottom-auto md:left-[6vw] md:top-1/2 md:w-[46vw] md:-translate-y-1/2";

/**
 * The landing page: one scroll-driven story about one student's year at
 * Rise. The stage pins while the canvas and the copy play through the
 * chapters in `story.ts`, ending on the application, then lets go so the
 * footer can scroll in. Three clicks on the logo open a hidden game.
 */
export function LandingPage() {
  const session = useQuery(sessionQuery());
  // Pending or failed sessions get the signed-out header.
  const user = session.data?.user;
  // Whether a cohort is open decides "Apply now" or "Join the waitlist".
  const admissions = useQuery(admissionsQuery()).data;
  const open = admissions?.cohortsOpen ?? false;

  const headerRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const copyRef = React.useRef<HTMLDivElement>(null);
  const footerRef = React.useRef<HTMLElement>(null);
  const railFillRef = React.useRef<HTMLDivElement>(null);
  const railLabelRef = React.useRef<HTMLSpanElement>(null);
  const lenisRef = React.useRef<Lenis | null>(null);
  const measureSlotRef = React.useRef<() => void>(() => {});
  const tweenRef = React.useRef<gsap.core.Tween | null>(null);

  const [gameOpen, setGameOpen] = React.useState(false);
  const clicks = React.useRef<number[]>([]);

  function handleLogoClick() {
    const now = performance.now();
    clicks.current = [...clicks.current, now].filter((time) => now - time < TRIPLE_CLICK_MS);
    if (clicks.current.length >= 3) {
      clicks.current = [];
      setGameOpen(true);
    }
  }

  /**
   * Scrolls the story to a chapter, playing everything in between, or cuts
   * straight there with `instant` (the header button, which may be a whole
   * story away).
   */
  function jumpTo(target: ChapterId | "top", { instant = false } = {}) {
    const stage = stageRef.current;
    if (!stage) return;
    let y = 0;
    if (target !== "top") {
      const span = SPANS[CHAPTERS.findIndex((chapter) => chapter.id === target)];
      const top = stage.getBoundingClientRect().top + window.scrollY;
      const length = stage.offsetHeight - window.innerHeight;
      // Land where that chapter's copy is fully up; the last screen is
      // only finished at its very end.
      const at = target === "end" ? 1 : 0.62;
      y = top + length * (span.start + (span.end - span.start) * at);
    }
    if (lenisRef.current) lenisRef.current.scrollTo(y, instant ? { immediate: true } : { duration: 2.6 });
    else window.scrollTo({ top: y });
    if (instant) {
      // Skip the scrub's catch-up too, or the whole story flashes past.
      ScrollTrigger.update();
      tweenRef.current?.scrollTrigger?.getTween()?.progress(1);
    }
  }

  // The last screen's kicker and title change with admissions; re-measure
  // where the mark lands once they have.
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => measureSlotRef.current());
    return () => cancelAnimationFrame(frame);
  }, [admissions]);

  React.useEffect(() => {
    if (gameOpen) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, [gameOpen]);

  React.useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const copy = copyRef.current;
    if (!stage || !canvas || !copy) return;

    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = createScene(canvas, { reduced });

    const lenis = reduced ? null : new Lenis({ lerp: 0.075 });
    lenisRef.current = lenis;
    lenis?.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: "bottom bottom",
        // A longer catch-up so every transition glides rather than snaps.
        scrub: reduced ? true : 0.9,
      },
    });
    tweenRef.current = tween;

    const blocks = Array.from(copy.querySelectorAll<HTMLElement>("[data-chapter]"));

    // The mark lands in the gap beside the application heading.
    const slot = copy.querySelector<HTMLElement>("[data-logo-slot]");
    const measureSlot = () => {
      if (!slot || !scene) return;
      const box = canvas.getBoundingClientRect();
      const rect = slot.getBoundingClientRect();
      scene.setSlot({
        x: rect.left - box.left + rect.width / 2,
        y: rect.top - box.top + rect.height / 2,
        height: rect.height,
      });
    };
    measureSlotRef.current = measureSlot;

    let lastIndex = -1;
    let lastDark = false;
    let lastScrolled = false;
    const render = (time: number) => {
      // Read layout before writing any styles this frame.
      const footerTop = footerRef.current?.getBoundingClientRect().top ?? Infinity;
      const scrolled = window.scrollY > 8;

      scene?.draw(state.p, time);

      const { index, local } = storyPosition(state.p, reduced);
      blocks.forEach((el, i) => {
        const id = CHAPTERS[i].id;
        const current = i === index;
        const out = easeInOutSine(
          id === "end" ? 0 : id === "hero" ? ramp(local, 0.38, 0.7) : ramp(local, 0.78, 0.98)
        );
        const visible = current ? 1 - out : 0;

        el.style.opacity = String(visible);
        el.style.visibility = visible > 0.001 ? "visible" : "hidden";
        if (!current) return;

        // Looked up each frame: the last screen's copy changes with admissions.
        const words = el.querySelectorAll<HTMLElement>("[data-word]");
        const fades = el.querySelectorAll<HTMLElement>("[data-fade]");

        // The hero is already up when the page opens; the application waits
        // for the mark to shrink into its heading.
        const wordsAt = id === "end" ? 0.3 : 0.12;
        const fadeAt = id === "end" ? 0.42 : 0.28;
        words.forEach((word, k) => {
          const t = id === "hero" ? 1 : ramp(local, wordsAt + k * 0.035, wordsAt + 0.26 + k * 0.035);
          const eased = 1 - (1 - t) ** 3;
          word.style.transform = `translate3d(0, ${(1 - eased) * 105}%, 0)`;
        });
        const fade = id === "hero" ? 1 : easeInOutSine(ramp(local, fadeAt, fadeAt + 0.24));
        fades.forEach((node) => {
          node.style.opacity = String(fade);
          node.style.transform = `translate3d(0, ${(1 - fade) * 12}px, 0)`;
        });
      });

      if (railFillRef.current) railFillRef.current.style.transform = `scaleY(${state.p})`;
      if (index !== lastIndex && railLabelRef.current) {
        railLabelRef.current.textContent = CHAPTERS[index].rail;
        lastIndex = index;
      }

      // The header turns white over the dark stipend room and the footer.
      const dark =
        (index === STIPEND && local > 0.16) || (index === STIPEND + 1 && local < 0.18) || footerTop < 48;
      if (dark !== lastDark && headerRef.current) {
        headerRef.current.dataset.dark = String(dark);
        lastDark = dark;
      }
      // Once you scroll, the header frosts over so it reads as its own layer.
      if (scrolled !== lastScrolled && headerRef.current) {
        headerRef.current.dataset.scrolled = String(scrolled);
        lastScrolled = scrolled;
      }
    };
    gsap.ticker.add(render);

    const observer = new ResizeObserver(() => {
      scene?.resize();
      measureSlot();
      ScrollTrigger.refresh();
    });
    observer.observe(canvas);
    // The heading moves once the real font arrives.
    document.fonts?.ready.then(measureSlot);

    return () => {
      observer.disconnect();
      gsap.ticker.remove(render);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      tween.scrollTrigger?.kill();
      tween.kill();
      lenis?.destroy();
      lenisRef.current = null;
      tweenRef.current = null;
    };
  }, []);

  return (
    <main className="relative bg-white">
      <header
        ref={headerRef}
        data-dark="false"
        data-scrolled="false"
        className={cn(
          "group pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-4 border-b border-transparent px-6 py-5 transition-[background-color,border-color,padding] duration-500 ease-out sm:px-10 sm:py-6",
          "data-[scrolled=true]:border-neutral-200/70 data-[scrolled=true]:bg-white/65 data-[scrolled=true]:py-3 data-[scrolled=true]:backdrop-blur-xl data-[scrolled=true]:backdrop-saturate-150 sm:data-[scrolled=true]:py-3.5",
          "data-[scrolled=true]:data-[dark=true]:border-white/10 data-[scrolled=true]:data-[dark=true]:bg-neutral-800/55"
        )}
      >
        {/* Three clicks here open the game. */}
        <button
          type="button"
          data-easter-egg-trigger
          onClick={handleLogoClick}
          aria-label="Rise Classroom"
          className="pointer-events-auto grid rounded-lg outline-none select-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <Logo
            variant="teal"
            size="sm"
            className="col-start-1 row-start-1 transition-opacity duration-300 group-data-[dark=true]:opacity-0"
          />
          <Logo
            variant="white"
            size="sm"
            className="col-start-1 row-start-1 opacity-0 transition-opacity duration-300 group-data-[dark=true]:opacity-100"
          />
        </button>

        {user ? (
          <Button
            variant="primary"
            size="medium"
            pill
            className="pointer-events-auto cursor-pointer px-5"
            nativeButton={false}
            render={<Link href={landingPathFor(user)} />}
          >
            Hi {user.displayName ?? user.firstName}
            <span className="hidden font-normal opacity-80 sm:inline">· Back to your dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-4">
            <Link
              href="/sign-in"
              className="rounded-full px-3 py-2 text-sm font-medium text-neutral-800 transition-colors outline-none hover:text-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary group-data-[dark=true]:text-white"
            >
              Sign in
            </Link>
            {admissions && (
              <Button
                variant="primary"
                size="medium"
                pill
                className="cursor-pointer px-5"
                onClick={() => jumpTo("end", { instant: true })}
              >
                {open ? "Apply now" : "Join the waitlist"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </header>

      <section ref={stageRef} className="relative" style={{ height: `${(TOTAL_SCREENS + 1) * 100}vh` }}>
        <div className="sticky top-0 h-dvh w-full overflow-hidden">
          <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

          <div ref={copyRef} className="pointer-events-none absolute inset-0 z-10">
            {CHAPTERS.map((chapter, i) =>
              chapter.id === "end" ? (
                <ApplicationCopy key={chapter.id} chapter={chapter} admissions={admissions} />
              ) : (
                <ChapterCopy key={chapter.id} chapter={chapter} first={i === 0} />
              )
            )}
          </div>

          {/* Progress rail. */}
          <div className="pointer-events-none absolute top-1/2 right-6 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
            <div className="relative h-[28vh] w-px overflow-hidden bg-neutral-200">
              <div ref={railFillRef} className="absolute inset-0 origin-top scale-y-0 bg-brand-primary" />
            </div>
            <span
              ref={railLabelRef}
              className="text-[11px] font-medium tracking-[0.18em] text-neutral-400 uppercase [writing-mode:vertical-rl]"
            >
              {CHAPTERS[0].rail}
            </span>
          </div>
        </div>
      </section>

      <LandingFooter ref={footerRef} open={open} onJump={jumpTo} />

      {gameOpen && <StackGame onClose={() => setGameOpen(false)} />}
    </main>
  );
}

function ChapterCopy({ chapter, first }: { chapter: Chapter; first: boolean }) {
  const Heading = first ? "h1" : "h2";
  const centred = !first && (chapter.align === "top" || chapter.align === "bottom");

  return (
    <div
      data-chapter={chapter.id}
      className={cn("absolute right-5 bottom-8 left-5", first ? HERO_ALIGN : ALIGN[chapter.align])}
      style={{ opacity: first ? 1 : 0, visibility: first ? "visible" : "hidden" }}
    >
      {chapter.kicker && (
        <p
          data-fade
          className={cn(
            "mb-4 text-xs font-medium tracking-[0.16em] uppercase md:text-sm",
            chapter.dark ? "text-[#7FC4CB]" : "text-brand-primary"
          )}
        >
          {chapter.kicker}
        </p>
      )}

      <Heading
        className={cn(
          "font-bold tracking-[-0.03em] text-balance",
          first
            ? "text-[clamp(2.5rem,5.4vw,6.5rem)] leading-[0.92]"
            : "text-[clamp(2.1rem,4.4vw,4.75rem)] leading-[0.95]",
          chapter.dark ? "text-white" : "text-neutral-800"
        )}
      >
        <RevealTitle text={chapter.title} />
      </Heading>

      {chapter.body && (
        <p
          data-fade
          className={cn(
            "mt-5 max-w-xl text-base leading-relaxed md:text-lg",
            centred && "md:mx-auto",
            chapter.dark ? "text-neutral-300" : "text-neutral-500"
          )}
        >
          {chapter.body}
        </p>
      )}

      {first && (
        <p data-fade className="mt-8 flex items-center gap-3 text-xs font-medium tracking-[0.16em] text-neutral-400 uppercase">
          Scroll
          <span className="h-px w-10 bg-neutral-300" />
        </p>
      )}
    </div>
  );
}
