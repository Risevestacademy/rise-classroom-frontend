"use client";

import "lenis/dist/lenis.css";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowRight } from "lucide-react";

import { Logo } from "@/assets/logo";
import { Button } from "@/components/ui/button";
import { CohortGame } from "@/components/home/CohortGame";
import { admissionsQuery } from "@/lib/admissions";
import { landingPeopleQuery, type Testimonial } from "@/lib/people";
import { landingPathFor } from "@/lib/auth";
import { easeInOutSine, easeOutQuart, ramp } from "@/lib/landing-timeline";
import { cn } from "@/lib/utils";
import { sessionQuery } from "@/lib/session-query";

import { ApplicationCopy } from "./ApplicationCopy";
import { HeroCopy } from "./HeroCopy";
import { LandingFaq } from "./LandingFaq";
import { LandingFooter } from "./LandingFooter";
import { RevealTitle } from "./RevealTitle";
import { SPANS, createScene, storyPosition, type Scene } from "./scene";
import { CHAPTERS, TOTAL_SCREENS, type Chapter, type ChapterId, type CopyAlign } from "./story";

/** Three clicks on the logo inside this window open the hidden game. */
const TRIPLE_CLICK_MS = 600;

/** Where each chapter's copy sits. Phones always get it at the bottom. */
const ALIGN: Record<CopyAlign, string> = {
  left: "md:right-auto md:bottom-auto md:left-[6vw] md:top-1/2 md:w-[38vw] md:-translate-y-1/2",
  right: "md:left-auto md:bottom-auto md:right-[7vw] md:top-1/2 md:w-[36vw] md:-translate-y-1/2",
  top: "md:right-[8vw] md:left-[8vw] md:bottom-auto md:top-[13vh] md:mx-auto md:max-w-[56rem] md:text-center",
  bottom: "md:right-[8vw] md:left-[8vw] md:bottom-[7vh] md:mx-auto md:max-w-[60rem] md:text-center",
};


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
  // Real people for the story: faces in the mark, the cohort, quotes.
  const people = useQuery(landingPeopleQuery()).data;

  const headerRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const copyRef = React.useRef<HTMLDivElement>(null);
  const footerRef = React.useRef<HTMLElement>(null);
  const railFillRef = React.useRef<HTMLDivElement>(null);
  const railRef = React.useRef<HTMLDivElement>(null);
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const railLabelRef = React.useRef<HTMLSpanElement>(null);
  const lenisRef = React.useRef<Lenis | null>(null);
  const measureSlotRef = React.useRef<() => void>(() => {});
  const tweenRef = React.useRef<gsap.core.Tween | null>(null);
  const sceneRef = React.useRef<Scene | null>(null);

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
    // Don't re-measure everything when a phone's browser bar slides in or out.
    ScrollTrigger.config({ ignoreMobileResize: true });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = createScene(canvas, { reduced });
    sceneRef.current = scene;

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
    // The hero lays out a box for its mark; the canvas draws the mark into it.
    const heroMark = copy.querySelector<HTMLElement>("[data-hero-mark]");
    const measureHero = () => {
      if (!heroMark || !scene) return;
      const box = canvas.getBoundingClientRect();
      const rect = heroMark.getBoundingClientRect();
      scene.setHeroBox({ x: rect.left - box.left, y: rect.top - box.top, w: rect.width, h: rect.height });
    };
    measureSlotRef.current = () => {
      measureSlot();
      measureHero();
    };
    measureHero();

    // The hero copy drifts left as the mark bursts.
    const heroCopy = copy.querySelector<HTMLElement>("[data-hero-line]");

    // On load the mark assembles and the headline rises: about two seconds,
    // once the font is in (or 700ms, whichever comes first). Skipped for
    // reduced motion; sped up if someone starts scrolling straight away.
    const intro = { t: reduced ? 1 : 0 };
    let introTween: gsap.core.Tween | null = null;
    let cancelled = false;
    // It also waits for the first portrait, so the slices land with the face
    // already on them, but never more than 2.5s on a slow connection.
    const fontsIn = Promise.race([document.fonts?.ready, new Promise((resolve) => setTimeout(resolve, 700))]);
    const faceIn = Promise.race([scene?.heroReady(), new Promise((resolve) => setTimeout(resolve, 2500))]);
    Promise.all([fontsIn, faceIn]).then(() => {
      if (!reduced && !cancelled) introTween = gsap.to(intro, { t: 1, duration: 2.2, ease: "none" });
    });

    // The hero mark and dot grid answer the mouse.
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = canvas.getBoundingClientRect();
      scene?.setPointer({ x: event.clientX - box.left, y: event.clientY - box.top });
    };
    const onPointerLeave = () => scene?.setPointer(null);
    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    let lastIndex = -1;
    let lastDark = false;
    let lastScrolled = false;
    let introDone = false;
    const render = (time: number) => {
      // Read layout before writing any styles this frame.
      const footerTop = footerRef.current?.getBoundingClientRect().top ?? Infinity;
      const scrolled = window.scrollY > 8;

      if (introTween?.isActive() && state.p > 0.003) introTween.timeScale(3);
      scene?.draw(state.p, time, intro.t);

      const { index, local } = storyPosition(state.p, reduced);
      blocks.forEach((el, i) => {
        const id = CHAPTERS[i].id;
        const current = i === index;
        // Rise Classroom keeps its copy up while the app is still open.
        const out = easeInOutSine(
          id === "end"
            ? 0
            : id === "hero"
              ? ramp(local, 0.14, 0.4)
              : id === "classroom"
                ? ramp(local, 0.86, 0.97)
                : ramp(local, 0.78, 0.98)
        );
        const visible = current ? 1 - out : 0;

        el.style.opacity = String(visible);
        el.style.visibility = visible > 0.001 ? "visible" : "hidden";
        if (!current) return;

        // Looked up each frame: the last screen's copy changes with admissions.
        const words = el.querySelectorAll<HTMLElement>("[data-word]");
        const fades = el.querySelectorAll<HTMLElement>("[data-fade]");

        // The hero's words rise with the load intro, not the scroll; the
        // application waits for the mark to shrink into its heading, and Rise
        // Classroom's copy for the mark to become the app icon.
        const wordsAt = id === "end" ? 0.3 : id === "classroom" ? 0.16 : 0.12;
        const fadeAt = id === "end" ? 0.42 : id === "classroom" ? 0.3 : 0.28;
        words.forEach((word, k) => {
          const t =
            id === "hero"
              ? ramp(intro.t, 0.3 + k * 0.07, 0.66 + k * 0.07)
              : ramp(local, wordsAt + k * 0.035, wordsAt + 0.26 + k * 0.035);
          const eased = id === "hero" ? easeOutQuart(t) : 1 - (1 - t) ** 3;
          word.style.transform = `translate3d(0, ${(1 - eased) * 105}%, 0)`;
        });
        const fade =
          id === "hero"
            ? easeInOutSine(ramp(intro.t, 0.72, 1))
            : easeInOutSine(ramp(local, fadeAt, fadeAt + 0.24));
        fades.forEach((node) => {
          node.style.opacity = String(fade);
          node.style.transform = `translate3d(0, ${(1 - fade) * 12}px, 0)`;
        });

        if (id === "hero" && heroCopy) {
          const part = easeInOutSine(ramp(local, 0.04, 0.7));
          heroCopy.style.transform = `translate3d(${-part * 6}vw, 0, 0)`;
        }

        // The photo caption follows whichever portrait the mark is showing.
        if (id === "hero" && scene) {
          const slide = scene.heroSlide();
          el.querySelectorAll<HTMLElement>("[data-hero-caption]").forEach((caption) => {
            const k = Number(caption.dataset.heroCaption);
            const shown =
              (k === slide.index ? 1 - slide.t : 0) + (k === slide.next && slide.next !== slide.index ? slide.t : 0);
            caption.style.opacity = String(shown * easeInOutSine(ramp(intro.t, 0.85, 1)));
          });
        }
      });

      // The header slides in at the end of the intro.
      if (headerRef.current && intro.t <= 1 && !introDone) {
        const enter = easeOutQuart(ramp(intro.t, 0.55, 0.9));
        headerRef.current.style.opacity = String(enter);
        headerRef.current.style.translate = `0 ${(1 - enter) * -16}px`;
        introDone = intro.t >= 1;
      }

      // The hero's brand field gives way to the white story as the mark bursts.
      const field = index === 0 ? 1 - easeInOutSine(ramp(local, 0.1, 0.42)) : 0;
      if (fieldRef.current) fieldRef.current.style.opacity = String(field);
      // The progress rail stays out of the hero's composition.
      if (railRef.current) railRef.current.style.opacity = String(1 - field);

      if (railFillRef.current) railFillRef.current.style.transform = `scaleY(${state.p})`;
      if (index !== lastIndex && railLabelRef.current) {
        railLabelRef.current.textContent = CHAPTERS[index].rail;
        lastIndex = index;
      }

      // On the hero the header keeps its opening look (white, no background)
      // until the mark has scattered and the brand field has gone.
      const inHero = index === 0 && local < 0.42;
      // The header turns white over the brand hero and the footer.
      const dark = inHero || footerTop < 48;
      if (dark !== lastDark && headerRef.current) {
        headerRef.current.dataset.dark = String(dark);
        lastDark = dark;
      }
      // Once the story is under way, the header frosts over so it reads as its own layer.
      const frosted = scrolled && !inHero;
      if (frosted !== lastScrolled && headerRef.current) {
        headerRef.current.dataset.scrolled = String(frosted);
        lastScrolled = frosted;
      }
    };
    gsap.ticker.add(render);

    // Resizes are coalesced to one per frame and redrawn straight away, so a
    // resized (and so wiped) canvas never reaches the screen blank. The
    // timeline is only re-measured for real changes, not a browser bar.
    let resizeFrame = 0;
    let measured = { w: 0, h: 0 };
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        scene?.resize();
        measureSlot();
        measureHero();
        render(gsap.ticker.time);
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (w !== measured.w || Math.abs(h - measured.h) > 160) {
          measured = { w, h };
          ScrollTrigger.refresh();
        }
      });
    });
    observer.observe(canvas);
    // The heading moves once the real font arrives.
    document.fonts?.ready.then(() => {
      measureSlot();
      measureHero();
    });

    return () => {
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      cancelled = true;
      introTween?.kill();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      gsap.ticker.remove(render);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      tween.scrollTrigger?.kill();
      tween.kill();
      lenis?.destroy();
      lenisRef.current = null;
      sceneRef.current = null;
      tweenRef.current = null;
    };
  }, []);

  // Declared after the effect that creates the scene, so it runs after it.
  React.useEffect(() => {
    if (people) sceneRef.current?.setPeople(people);
  }, [people]);

  return (
    <main className="relative bg-white">
      <header
        ref={headerRef}
        // Hidden until the load intro brings it in.
        style={{ opacity: 0 }}
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
              className="hidden rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-neutral-800 sm:inline-flex transition-colors outline-none hover:text-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary group-data-[dark=true]:text-white"
            >
              Sign in
            </Link>
            {admissions && (
              <Button
                variant="primary"
                size="medium"
                pill
                className="cursor-pointer px-5 group-data-[dark=true]:bg-white group-data-[dark=true]:text-brand-primary group-data-[dark=true]:hover:bg-brand-surface"
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
          <div ref={fieldRef} aria-hidden className="absolute inset-0 bg-brand-primary" />
          <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

          <div ref={copyRef} className="pointer-events-none absolute inset-0 z-10">
            {CHAPTERS.map((chapter) =>
              chapter.id === "hero" ? (
                <HeroCopy
                  key={chapter.id}
                  chapter={chapter}
                  admissions={admissions}
                  people={people}
                  onSeat={() => jumpTo("end", { instant: true })}
                />
              ) : chapter.id === "end" ? (
                <ApplicationCopy key={chapter.id} chapter={chapter} admissions={admissions} />
              ) : (
                <ChapterCopy
                  key={chapter.id}
                  chapter={chapter}
                  testimonial={people?.testimonials.find((t) => t.chapter === chapter.id)}
                />
              )
            )}
          </div>

          {/* Progress rail. */}
          <div
            ref={railRef}
            style={{ opacity: 0 }}
            className="pointer-events-none absolute top-1/2 right-6 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex"
          >
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

      <LandingFaq />

      <LandingFooter ref={footerRef} open={open} onJump={jumpTo} />

      {gameOpen && <CohortGame onClose={() => setGameOpen(false)} />}
    </main>
  );
}

function ChapterCopy({ chapter, testimonial }: { chapter: Chapter; testimonial?: Testimonial }) {
  const centred = chapter.align === "top" || chapter.align === "bottom";

  return (
    <div
      data-chapter={chapter.id}
      className={cn("absolute right-5 bottom-8 left-5", ALIGN[chapter.align])}
      style={{ opacity: 0, visibility: "hidden" }}
    >
      {chapter.kicker && (
        <p
          data-fade
          className={cn(
            "mb-4 text-xs font-medium tracking-[0.16em] uppercase md:text-sm",
            chapter.dark ? "text-white/70" : "text-brand-primary"
          )}
        >
          {chapter.kicker}
        </p>
      )}

      <h2
        className={cn(
          // Scales with height too, so tall copy never runs off short screens.
          "text-[clamp(2rem,min(4.4vw,7.4vh),4.75rem)] leading-[0.95] font-bold tracking-[-0.03em] text-balance",
          chapter.dark ? "text-white" : "text-neutral-800"
        )}
      >
        <RevealTitle text={chapter.title} />
      </h2>

      {chapter.body && (
        <p
          data-fade
          className={cn(
            "mt-5 max-w-xl text-base leading-relaxed md:text-lg",
            centred && "md:mx-auto",
            chapter.dark ? "text-white/80" : "text-neutral-500"
          )}
        >
          {chapter.body}
        </p>
      )}

      {testimonial && (
        <figure
          data-fade
          className={cn("mt-6 flex max-w-xl items-start gap-3.5 text-left md:mt-8", centred && "md:mx-auto")}
        >
          <Image
            src={testimonial.person.photo}
            alt=""
            width={48}
            height={48}
            // The copy is hidden until its chapter, so lazy loading would wait
            // until the moment it's needed.
            loading="eager"
            className="h-12 w-12 shrink-0 rounded-full object-cover"
            style={{ objectPosition: `${testimonial.person.focus.x * 100}% ${testimonial.person.focus.y * 100}%` }}
          />
          <div>
            <blockquote
              className={cn("text-base leading-snug md:text-lg", chapter.dark ? "text-white" : "text-neutral-800")}
            >
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <figcaption className={cn("mt-1.5 text-sm", chapter.dark ? "text-white/60" : "text-neutral-500")}>
              {testimonial.person.name} ·{" "}
              {testimonial.person.role === "Student" ? `${testimonial.person.track} student` : testimonial.person.role}
            </figcaption>
          </div>
        </figure>
      )}

    </div>
  );
}
