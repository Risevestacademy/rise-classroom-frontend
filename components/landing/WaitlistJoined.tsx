"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Share2 } from "lucide-react";

import { Logo } from "@/assets/logo";
import { parseWaitlistReceipt, readWaitlistReceiptRaw } from "@/lib/admissions";

const STEPS = [
  { title: "Applications open", body: "We email you a link to apply." },
  { title: "You apply for your track", body: "A short application, and it's free." },
  { title: "Week 01", body: "If you're in, you meet your cohort and start." },
];

// The receipt only changes when someone submits the form, on another page.
const noSubscription = () => () => {};

/**
 * The thank-you page after joining the waitlist. On the same teal as the
 * landing page's opening screen, so it feels like the end of the same story.
 * Shows back the name, email and track they just gave, from this tab's
 * storage; anyone who lands here directly gets the same page without them.
 */
export function WaitlistJoined() {
  const raw = React.useSyncExternalStore(noSubscription, readWaitlistReceiptRaw, () => null);
  const receipt = React.useMemo(() => parseWaitlistReceipt(raw), [raw]);
  const firstName = receipt?.name.split(/\s+/)[0];
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
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-brand-primary px-6 py-5 text-white sm:px-10 sm:py-6">
      {/* The mark, huge and faint, holding the right side. */}
      <Image
        src="/classroom-logo-white.svg"
        alt=""
        aria-hidden
        width={37}
        height={31}
        className="pointer-events-none absolute top-1/2 right-[-12vw] hidden h-auto w-[62vw] max-w-[900px] -translate-y-1/2 opacity-[0.08] md:block"
      />

      <header className="relative">
        <Link href="/" aria-label="Rise Classroom home" className="inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white">
          <Logo variant="white" size="sm" />
        </Link>
      </header>

      <div className="relative my-auto max-w-[44rem] py-10 md:py-8">
        <p className="flex items-center gap-2.5 text-sm font-medium text-white/75">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-brand-primary">
            <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          You&apos;re on the waitlist
        </p>

        <h1 className="mt-5 text-[clamp(2.75rem,min(7vw,11vh),6.5rem)] leading-[0.94] font-bold tracking-[-0.045em]">
          {firstName ? (
            <>
              See you soon,
              <br />
              <span className="text-[#9AD3D8]">{firstName}.</span>
            </>
          ) : (
            <>
              You&apos;re on
              <br />
              <span className="text-[#9AD3D8]">the list.</span>
            </>
          )}
        </h1>

        <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-white/80">
          {receipt ? (
            <>
              We&apos;ll email <span className="font-bold text-white">{receipt.email}</span> the moment{" "}
              {receipt.cohort ?? "applications"} {receipt.cohort ? "opens" : "open"}, so you can apply for the{" "}
              <span className="font-bold text-white">{receipt.track}</span> track.
            </>
          ) : (
            "We'll email you the moment applications open, so you can apply for your track."
          )}
        </p>

        <ol className="mt-8 grid gap-6 border-t border-white/15 pt-6 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, k) => (
            <li key={step.title}>
              <span className="text-xs font-medium text-white/50">0{k + 1}</span>
              <p className="mt-2 font-bold">{step.title}</p>
              <p className="mt-1 text-sm leading-snug text-white/70">{step.body}</p>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-sm text-white/70">
          When your cohort starts, you&apos;ll find everything in{" "}
          <span className="font-bold text-white">Rise Classroom</span>.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-brand-primary transition-colors outline-none hover:bg-brand-surface focus-visible:ring-4 focus-visible:ring-white/40"
          >
            <ArrowLeft aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Back to Rise Classroom
          </Link>
          <button
            type="button"
            onClick={share}
            className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-white/30 px-6 text-sm font-bold text-white transition-colors outline-none hover:border-white hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-white/40"
          >
            <Share2 aria-hidden className="h-4 w-4" />
            <span aria-live="polite">{copied ? "Link copied" : "Tell a friend"}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
