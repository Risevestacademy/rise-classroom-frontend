"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Check, Share2 } from "lucide-react";

import { Logo } from "@/assets/logo";
import { LOGO_BANDS, LOGO_VIEWBOX } from "@/components/home/logo-bands";
import { admissionsQuery, parseWaitlistReceipt, readWaitlistReceiptRaw } from "@/lib/admissions";

const STEPS = [
  { title: "You're on the list", body: "Your seat is saved. Nothing else to do yet." },
  { title: "Applications open", body: "We email you a link. It's short, and it's free." },
  { title: "Week 01", body: "If you're in, you meet your cohort and start." },
];

// The receipt only changes when someone submits the form, on another page.
const noSubscription = () => () => {};

/** A small stable number from a string, for the pass's reference and barcode. */
function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A film grain over the page, so the flat indigo feels printed. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * The thank-you page after joining the waitlist: an admission pass for the
 * cohort, on the same indigo as the landing page's opening screen. The pass
 * tilts toward the pointer and catches the light; the Rise mark on it
 * assembles band by band. Shows back the name, email and track they just
 * gave, from this tab's storage; anyone who lands here directly gets the same
 * page with a blank pass.
 */
export function WaitlistJoined() {
  const raw = React.useSyncExternalStore(noSubscription, readWaitlistReceiptRaw, () => null);
  const receipt = React.useMemo(() => parseWaitlistReceipt(raw), [raw]);
  const admissions = useQuery(admissionsQuery()).data;
  const firstName = receipt?.name.trim().split(/\s+/)[0];
  const cohort = receipt?.cohort ?? admissions?.cohort?.name ?? "Next cohort";
  const [copied, setCopied] = React.useState(false);

  async function share() {
    const url = window.location.origin;
    const text = "Rise Academy: a free, virtual programme for designers and engineers, by Risevest.";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Rise Academy", text, url });
      } catch {
        // Closing the share sheet isn't an error worth showing.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2400);
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-brand-950 text-white">
      {/* Light falling on the page, and grain. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[30vh] left-[40vw] h-[90vh] w-[90vh] rounded-full bg-brand-700/40 blur-[120px]" />
        <div className="absolute -bottom-[40vh] -left-[20vh] h-[80vh] w-[80vh] rounded-full bg-brand-800/60 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-[1440px] flex-col px-6 py-5 sm:px-10 sm:py-6 lg:px-[5vw]">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Rise Classroom home"
            className="inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Logo variant="white" size="sm" />
          </Link>
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-medium text-white/70 transition-colors outline-none hover:text-white focus-visible:text-white"
          >
            <ArrowLeft aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back to Rise Classroom</span>
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-12 lg:gap-8 lg:py-6">
          <section className="lg:col-span-7">
            <p className="waitlist-in flex items-center gap-2.5 text-sm font-medium text-white/80 [--d:100ms]">
              <span className="relative grid h-6 w-6 place-items-center rounded-full bg-brand-300 text-brand-950">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand-300/60 motion-reduce:hidden" />
                <Check aria-hidden className="relative h-3.5 w-3.5" strokeWidth={3} />
              </span>
              You&apos;re on the waitlist for {cohort}
            </p>

            <h1 className="mt-6 text-[clamp(3rem,min(7.2vw,13vh),8rem)] leading-[0.88] font-bold tracking-[-0.055em]">
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="waitlist-rise block [--d:180ms]">{firstName ? "See you soon," : "You're on"}</span>
              </span>
              <span className="block overflow-hidden pb-[0.1em]">
                <span className="waitlist-rise block break-words text-brand-300 italic [--d:300ms]">
                  {firstName ? `${firstName}.` : "the list."}
                </span>
              </span>
            </h1>

            <p className="waitlist-in mt-6 max-w-[34rem] text-lg leading-relaxed text-white/75 [--d:520ms] md:text-xl">
              {receipt ? (
                <>
                  Your seat on the <span className="font-bold text-white">{receipt.track}</span> track is saved.
                  We&apos;ll email <span className="font-bold break-words text-white">{receipt.email}</span> the moment{" "}
                  {cohort} opens.
                </>
              ) : (
                "Your seat is saved. We'll email you the moment applications open."
              )}
            </p>

            <div className="waitlist-in mt-9 flex flex-wrap items-center gap-3 [--d:640ms]">
              <button
                type="button"
                onClick={share}
                className="group inline-flex h-13 cursor-pointer items-center gap-2.5 rounded-full bg-white pr-2 pl-6 text-sm font-bold text-brand-950 transition-transform duration-300 outline-none hover:scale-[1.03] focus-visible:ring-4 focus-visible:ring-brand-300/50"
              >
                <span aria-live="polite">{copied ? "Link copied" : "Bring a friend along"}</span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-950 text-white transition-transform duration-500 group-hover:rotate-45">
                  {copied ? <Check aria-hidden className="h-4 w-4" /> : <Share2 aria-hidden className="h-4 w-4" />}
                </span>
              </button>
              <Link
                href="/"
                className="inline-flex h-13 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-bold text-white transition-colors outline-none hover:border-white/60 hover:bg-white/5 focus-visible:ring-4 focus-visible:ring-brand-300/50"
              >
                Replay the story
                <ArrowUpRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <Pass
              name={receipt?.name.trim() || "Your name here"}
              track={receipt?.track ?? "Your track"}
              cohort={cohort}
              seed={receipt?.email ?? "rise"}
            />
          </div>
        </div>

        <ol className="grid gap-6 border-t border-white/10 pt-6 pb-2 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, k) => (
            <li key={step.title} className="waitlist-in relative" style={{ ["--d" as string]: `${760 + k * 110}ms` }}>
              <div className="flex items-center gap-3">
                <span
                  className={
                    k === 0
                      ? "grid h-7 w-7 place-items-center rounded-full bg-brand-300 text-brand-950"
                      : "grid h-7 w-7 place-items-center rounded-full border border-white/25 text-[11px] font-medium text-white/60"
                  }
                >
                  {k === 0 ? <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} /> : `0${k + 1}`}
                </span>
                {k === 0 && (
                  <span className="text-[11px] font-medium tracking-[0.16em] text-brand-300 uppercase">You are here</span>
                )}
              </div>
              <p className="mt-3 font-bold">{step.title}</p>
              <p className="mt-1 text-sm leading-snug text-white/60">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}

/**
 * The admission pass. Tilts toward the pointer with a holographic sheen
 * where the light catches it; floats gently on its own on touch screens and
 * stays still for reduced motion.
 */
function Pass({ name, track, cohort, seed }: { name: string; track: string; cohort: string; seed: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const code = hash(seed);
  const reference = `RC-${cohort.replace(/\D/g, "") || "0"}-${code.toString(36).slice(0, 4).toUpperCase().padStart(4, "0")}`;
  // Barcode stripes from the same number, so each pass has its own.
  const bars = Array.from({ length: 34 }, (_, k) => 1 + ((code >>> k % 24) + k * 7) % 3);

  React.useEffect(() => {
    const card = ref.current;
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let target = { x: 0.5, y: 0.5 };
    const now = { x: 0.5, y: 0.5 };
    function onMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const box = card!.getBoundingClientRect();
      target = {
        x: Math.min(Math.max((event.clientX - box.left) / box.width, -0.5), 1.5),
        y: Math.min(Math.max((event.clientY - box.top) / box.height, -0.5), 1.5),
      };
    }
    function tick() {
      now.x += (target.x - now.x) * 0.08;
      now.y += (target.y - now.y) * 0.08;
      card!.style.setProperty("--ry", `${(now.x - 0.5) * 16}deg`);
      card!.style.setProperty("--rx", `${(0.5 - now.y) * 12}deg`);
      card!.style.setProperty("--mx", `${now.x * 100}%`);
      card!.style.setProperty("--my", `${now.y * 100}%`);
      frame = requestAnimationFrame(tick);
    }
    window.addEventListener("pointermove", onMove);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="waitlist-drop w-full max-w-[400px] [perspective:1200px] [--d:250ms]">
      <div
        ref={ref}
        // The ticket is cut with a mask, which would clip a box-shadow; a drop-shadow follows the cut.
        className="waitlist-float relative transition-transform duration-200 ease-out [filter:drop-shadow(0_40px_50px_rgba(0,0,0,0.5))] [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]"
      >
        {/* Ticket body: a punched-out notch on each side at the tear line. */}
        <div
          className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-700 via-brand-800 to-brand-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
          style={{
            WebkitMask:
              "radial-gradient(circle 16px at 0 72%, transparent 15px, #000 16px) left / 51% 100% no-repeat, radial-gradient(circle 16px at 100% 72%, transparent 15px, #000 16px) right / 51% 100% no-repeat",
            mask: "radial-gradient(circle 16px at 0 72%, transparent 15px, #000 16px) left / 51% 100% no-repeat, radial-gradient(circle 16px at 100% 72%, transparent 15px, #000 16px) right / 51% 100% no-repeat",
          }}
        >
          {/* Where the light catches it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-90 mix-blend-soft-light"
            style={{
              background:
                "radial-gradient(circle at var(--mx,30%) var(--my,20%), rgba(255,255,255,0.55), transparent 45%), linear-gradient(115deg, transparent 20%, rgba(184,191,255,0.35) 40%, rgba(255,214,250,0.25) 50%, rgba(160,255,240,0.25) 60%, transparent 80%)",
              backgroundSize: "100% 100%, 220% 220%",
              backgroundPosition: "0 0, var(--mx,30%) var(--my,20%)",
            }}
          />

          <div className="relative p-7 pb-0">
            <div className="flex items-start justify-between text-[11px] font-medium tracking-[0.16em] uppercase">
              <span className="text-white/60">Rise Academy</span>
              <span className="text-brand-300">Admit one</span>
            </div>

            <div className="mt-6 flex items-center justify-between">
              {/* The Rise mark in foil, assembling band by band. */}
              <svg
                viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
                aria-hidden
                className="h-auto w-[48%] overflow-visible"
              >
                <defs>
                  <linearGradient id="pass-foil" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#FFFFFF" />
                    <stop offset="0.45" stopColor="#D5D9FF" />
                    <stop offset="0.6" stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#B8BFFF" />
                  </linearGradient>
                </defs>
                {LOGO_BANDS.map((d, k) => (
                  <path
                    key={k}
                    d={d}
                    fill="url(#pass-foil)"
                    className="waitlist-band"
                    style={{ ["--d" as string]: `${700 + k * 140}ms` }}
                  />
                ))}
              </svg>
              <Seal cohort={cohort} />
            </div>

            <p className="mt-8 text-[11px] font-medium tracking-[0.16em] text-white/50 uppercase">Rise Classroom pass</p>
            <p className="mt-1 truncate text-3xl leading-tight font-bold tracking-[-0.03em]">{name}</p>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 pb-8 text-sm">
              <div>
                <dt className="text-[11px] tracking-[0.14em] text-white/45 uppercase">Track</dt>
                <dd className="mt-1 font-bold">{track}</dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-[0.14em] text-white/45 uppercase">Cohort</dt>
                <dd className="mt-1 font-bold">{cohort}</dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-[0.14em] text-white/45 uppercase">Status</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
                  Waitlisted
                </dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-[0.14em] text-white/45 uppercase">Length</dt>
                <dd className="mt-1 font-bold">52 weeks</dd>
              </div>
            </dl>
          </div>

          {/* Tear line and stub. */}
          <div className="relative border-t-2 border-dashed border-white/20 px-7 pt-5 pb-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] tracking-[0.14em] text-white/45 uppercase">Ref</p>
                <p className="mt-1 font-mono text-sm font-bold tracking-wider">{reference}</p>
              </div>
              <div aria-hidden className="flex h-10 items-stretch gap-[2px]">
                {bars.map((width, k) => (
                  <span key={k} className="bg-white/85" style={{ width: `${width}px`, opacity: k % 5 === 0 ? 0.5 : 1 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A round seal with its words turning slowly around a check, like an embossed stamp. */
function Seal({ cohort }: { cohort: string }) {
  const words = `Rise Academy · ${cohort} · Waitlisted · `;
  return (
    <div aria-hidden className="relative grid h-[92px] w-[92px] shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" className="waitlist-spin absolute inset-0 h-full w-full">
        <defs>
          <path id="seal-ring" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text fill="rgba(255,255,255,0.75)" fontSize="9.4" fontWeight="600" letterSpacing="2.1">
          <textPath href="#seal-ring" textLength="236">
            {words.toUpperCase()}
          </textPath>
        </text>
      </svg>
      <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-300 text-brand-950 shadow-[0_0_30px_rgba(184,191,255,0.5)]">
        <Check className="h-5 w-5" strokeWidth={3} />
      </span>
    </div>
  );
}
