"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { Logo } from "@/assets/logo";
import { Button } from "@/components/ui/button";
import { StackGame } from "@/components/home/StackGame";
import { StudioField, type StudioLayout } from "@/components/home/StudioField";
import { landingPathFor } from "@/lib/auth";
import { sessionQuery } from "@/lib/session-query";

/** Three clicks on the logo inside this window open the hidden game. */
const TRIPLE_CLICK_MS = 600;

/**
 * Rise Classroom is an internal tool, so the root page has nothing to sell.
 * It's a small easter egg instead: a studio where instructors, mentors and
 * students work on something from each track — a design file, a web page, an
 * API and an app. Press and hold, and every piece of that work flies together
 * into the Rise mark. Three clicks on the logo open a hidden game.
 */
export default function HomePage() {
  const session = useQuery(sessionQuery());
  const user = session.data?.user;

  const [merged, setMerged] = React.useState(true);
  const [hasMerged, setHasMerged] = React.useState(false);
  const [layout, setLayout] = React.useState<StudioLayout | null>(null);
  const [gameOpen, setGameOpen] = React.useState(false);

  const clicks = React.useRef<number[]>([]);
  const introDone = React.useRef(false);

  function handleLogoClick() {
    const now = performance.now();
    clicks.current = [...clicks.current, now].filter(
      (time) => now - time < TRIPLE_CLICK_MS
    );
    if (clicks.current.length >= 3) {
      clicks.current = [];
      setGameOpen(true);
    }
  }

  function handleMergeChange(next: boolean) {
    setMerged(next);
    // The page opens merged; only count the visitor's own first merge.
    if (!next) introDone.current = true;
    else if (introDone.current) setHasMerged(true);
  }

  return (
    <main
      className="relative h-dvh w-full overflow-hidden bg-semantic-surface-brand"
      style={{
        // A design-tool canvas: a faint dot grid.
        backgroundImage:
          "radial-gradient(circle, rgb(17 24 25 / 0.09) 1px, transparent 1.4px)",
        backgroundSize: "22px 22px",
      }}
    >
      <StudioField
        paused={gameOpen}
        onMergeChange={handleMergeChange}
        onLayout={setLayout}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 px-6 py-5 sm:px-10 sm:py-6">
        {/* Three clicks here open the game. */}
        <button
          type="button"
          data-easter-egg-trigger
          onClick={handleLogoClick}
          aria-label="Rise Classroom"
          className="pointer-events-auto rounded-lg outline-none select-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <Logo variant="teal" size="sm" />
        </button>

        {!session.isPending && (
          <Button
            variant="primary"
            size="medium"
            pill
            className="pointer-events-auto cursor-pointer px-5"
            nativeButton={false}
            render={<Link href={user ? landingPathFor(user) : "/sign-in"} />}
          >
            {user ? (
              <>
                Hi {user.displayName ?? user.firstName}
                <span className="hidden font-normal opacity-80 sm:inline">
                  · Back to your dashboard
                </span>
              </>
            ) : (
              "Sign in"
            )}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </header>

      {layout && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center px-6 text-center transition-[top,transform] duration-700 ease-in-out"
          style={{
            top: merged ? layout.markBottom + 28 : layout.centerY,
            transform: merged ? "translateY(0)" : "translateY(-50%)",
          }}
        >
          <h1 className="text-3xl leading-tight font-bold [word-spacing:0.8rem] text-neutral-900 lg:text-4xl">
            Learn. Practice. Progress.
          </h1>

          <div
            className="flex flex-col items-center transition-opacity duration-300"
            style={{ opacity: merged ? 0 : 1 }}
          >
            <p className="mt-3 max-w-md text-sm text-neutral-600">
              Design, Frontend, Backend and Mobile — one studio, built
              together by students, mentors and instructors.
            </p>
            <p className="mt-6 flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700">
              {hasMerged ? "Hold again" : "Press and hold anywhere"}
              <span className="hidden text-neutral-400 sm:inline">or hold</span>
              <kbd className="hidden rounded-md border border-neutral-300 px-1.5 py-0.5 font-sans text-[11px] text-neutral-700 sm:inline">
                Space
              </kbd>
            </p>
          </div>
        </div>
      )}

      {gameOpen && <StackGame onClose={() => setGameOpen(false)} />}
    </main>
  );
}
