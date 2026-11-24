"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BRAND_PALETTE, Mascot, TEAL_PALETTE, type MascotMood } from "./Mascot";
import { InteractiveMascot } from "./InteractiveMascot";
import {
  BLOOM,
  MASCOT_STAGES,
  growthFromProgress,
  stageFromProgress,
  type MascotStage,
} from "./growth";

const MOODS: MascotMood[] = [
  "happy",
  "thinking",
  "celebrate",
  "sleepy",
  "worried",
  "proud",
];
const PALETTES = { teal: TEAL_PALETTE, brand: BRAND_PALETTE } as const;
const BACKGROUNDS = {
  light: "bg-surface-background",
  white: "bg-white",
  navy: "bg-brand-950",
} as const;

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = (v) => String(v),
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-neutral-600">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={String(option)}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors",
              option === value
                ? "border-brand-primary bg-brand-primary text-white"
                : "border-border-default bg-white text-neutral-600 hover:bg-neutral-100",
            )}
          >
            {format(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MascotPlayground() {
  const [progress, setProgress] = useState(55);
  const [mood, setMood] = useState<MascotMood>("happy");
  const [paletteKey, setPaletteKey] = useState<keyof typeof PALETTES>("teal");
  const [bg, setBg] = useState<keyof typeof BACKGROUNDS>("light");
  const [animated, setAnimated] = useState(true);

  const stage = stageFromProgress(progress / 100);
  const palette = PALETTES[paletteKey];
  const setStage = (s: MascotStage) =>
    setProgress(s === BLOOM ? 100 : Math.round(((s + 0.5) / BLOOM) * 100));

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header>
          <h1 className="text-2xl font-semibold text-neutral-800">
            Mascot preview
          </h1>
          <p className="mt-1 text-neutral-500">
            Draft for review. Not linked from the app. Move your cursor around
            and tap the mascot.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-[1fr_320px]">
          <div
            className={cn(
              "flex min-h-[420px] items-center justify-center rounded-2xl border border-border-default",
              BACKGROUNDS[bg],
            )}
          >
            <InteractiveMascot
              growth={growthFromProgress(progress / 100)}
              mood={mood}
              palette={palette}
              size={240}
              animated={animated}
            />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-neutral-600">
                Cohort progress: {progress}% ({MASCOT_STAGES[stage]})
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="accent-brand-primary"
              />
            </div>
            <Segmented
              label="Stage"
              options={[0, 1, 2, 3, 4, 5, 6] as MascotStage[]}
              value={stage}
              onChange={setStage}
              format={(s) => MASCOT_STAGES[s]}
            />
            <Segmented
              label="Mood"
              options={MOODS}
              value={mood}
              onChange={setMood}
            />
            <Segmented
              label="Palette"
              options={["teal", "brand"] as const}
              value={paletteKey}
              onChange={setPaletteKey}
              format={(p) =>
                p === "teal" ? "Teal tokens" : "Current globals.css"
              }
            />
            <Segmented
              label="Background"
              options={["light", "white", "navy"] as const}
              value={bg}
              onChange={setBg}
            />
            <Segmented
              label="Animation"
              options={["on", "off"] as const}
              value={animated ? "on" : "off"}
              onChange={(v) => setAnimated(v === "on")}
            />
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-neutral-800">
            Growth timeline
          </h2>
          <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-border-default bg-surface-background p-6">
            {MASCOT_STAGES.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setStage(i as MascotStage)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl p-2 transition-opacity",
                  i === stage
                    ? "bg-white shadow-sm"
                    : i > stage
                      ? "opacity-40"
                      : "",
                )}
              >
                <Mascot
                  stage={i as MascotStage}
                  palette={palette}
                  size={90}
                  animated={false}
                />
                <span className="text-sm text-neutral-600">{name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-neutral-800">
            Small sizes
          </h2>
          <div className="flex items-end gap-6 rounded-2xl border border-border-default p-6">
            {[32, 48, 64].map((s) => (
              <Mascot
                key={s}
                stage={stage}
                mood={mood}
                palette={palette}
                size={s}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
