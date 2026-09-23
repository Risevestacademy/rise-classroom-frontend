// app/design-system/buttons/page.tsx
// Server Component — no "use client" needed at the page level; Button itself
// stays a client component (it uses @base-ui/react/button under the hood).
//
// Assumes:
//   - Button + buttonVariants live at "@/components/ui/button"
//   - lucide-react is available
//   - --color-interactive-primary-hover: #0B5D67; is added to @theme
//
// VERIFICATION STATUS (important — read before trusting a row):
//   - Primary: every state/size number below is cross-checked against your
//     pasted Figma specs (sizing, padding, hex values all confirmed).
//   - Secondary / Outline / Ghost / Destructive: hover + disabled are pulled
//     from the *existing cva classes already in your codebase* — real, but
//     not yet checked against a Figma spec the way Primary was. Sizing
//     (32px height, 12px/8px padding) is ASSUMED shared across variants,
//     not confirmed per-variant. Paste their Figma specs and I'll swap the
//     assumed numbers for verified ones the same way we did for Primary.

import { ArrowLeft, ArrowRight, Settings } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type Variant = "primary" | "secondary" | "tertiary" | "destructive";
type IconConfig = "none" | "left" | "right" | "only";
type ButtonState = "default" | "hover" | "focused" | "disabled";

const ICON_CONFIGS: { key: IconConfig; label: string }[] = [
  { key: "none", label: "No icon" },
  { key: "left", label: "Icon left" },
  { key: "right", label: "Icon right" },
  { key: "only", label: "Icon only" },
];

const STATES: ButtonState[] = ["default", "hover", "focused", "disabled"];

const STATE_LABELS: Record<ButtonState, string> = {
  default: "Default",
  hover: "Hover",
  focused: "Focused",
  disabled: "Disabled",
};

// Focus ring is global (base classes), same for every variant — this part
// really is shared, not an assumption.
const FOCUSED_FORCE = "!border-ring !ring-3 !ring-ring/50";

// Hover force = the variant's own `hover:` class from buttonVariants, lifted
// out of the pseudo-class so it renders statically in this reference grid.
// Sourced directly from your cva, not invented.
const VARIANT_HOVER_FORCE: Record<Variant, string> = {
  primary: "!bg-interactive-primary-hover",
  secondary:
    "![background-color:color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
  tertiary:
    "![background-color:color-mix(in_oklch,var(--tertiary),var(--foreground)_5%)]",
  destructive: "!bg-destructive/20",
};

const VARIANT_LABELS: Record<Variant, string> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
  destructive: "Destructive",
};

// Primary is fully verified; everything else is assumed/unverified until
// specs are pasted.
const VERIFIED_VARIANTS: Variant[] = ["primary"];

function DemoIcon({ position }: { position: "inline-start" | "inline-end" }) {
  const Icon = position === "inline-start" ? ArrowLeft : ArrowRight;
  return <Icon data-icon={position} aria-hidden="true" />;
}

function stateOverrideClass(variant: Variant, state: ButtonState) {
  if (state === "hover") return VARIANT_HOVER_FORCE[variant];
  if (state === "focused")
    return cn(VARIANT_HOVER_FORCE[variant], FOCUSED_FORCE);
  return ""; // default + disabled need no override — disabled prop already
  // triggers the real (variant-agnostic) disabled look from cva.
}

function VariantCell({
  variant,
  icon,
  state,
}: {
  variant: Variant;
  icon: IconConfig;
  state: ButtonState;
}) {
  const isDisabled = state === "disabled";
  const overrideClass = stateOverrideClass(variant, state);

  if (icon === "only") {
    return (
      <Button
        variant={variant}
        size="icon-sm"
        disabled={isDisabled}
        aria-label="Settings"
        className={cn(overrideClass)}
      >
        <Settings aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={isDisabled}
      className={cn(overrideClass)}
    >
      {icon === "left" && <DemoIcon position="inline-start" />}
      Button
      {icon === "right" && <DemoIcon position="inline-end" />}
    </Button>
  );
}

function VariantStateMatrix({ variant }: { variant: Variant }) {
  const verified = VERIFIED_VARIANTS.includes(variant);
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold text-neutral-800">
          {VARIANT_LABELS[variant]} — Small
        </h2>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            verified
              ? "bg-success-50 text-success-700"
              : "bg-warning-50 text-warning-700"
          )}
        >
          {verified ? "Verified against Figma" : "Unverified — from code"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-neutral-100">
              <th className="w-32 p-3 text-left font-medium text-neutral-600">
                State
              </th>
              {ICON_CONFIGS.map(({ key, label }) => (
                <th
                  key={key}
                  className="p-3 text-left font-medium text-neutral-600"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATES.map((state) => (
              <tr key={state} className="border-b border-border last:border-0">
                <td className="p-3 font-medium text-neutral-700">
                  {STATE_LABELS[state]}
                </td>
                {ICON_CONFIGS.map(({ key }) => (
                  <td key={key} className="p-3">
                    <VariantCell variant={variant} icon={key} state={state} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ButtonShowcasePage() {
  const variants: Variant[] = [
    "primary",
    "secondary",
    "tertiary",
    "destructive",
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-12 px-6 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-neutral-900">
          Button — Design System Reference
        </h1>
        <p className="text-sm text-neutral-500">
          Small size. Hover/Focused cells are forced for static side-by-side
          display — see the live playground at the bottom for real
          pseudo-class behavior.
        </p>
      </header>

      {variants.map((variant) => (
        <VariantStateMatrix key={variant} variant={variant} />
      ))}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-800">
          Live playground (real states, Primary)
        </h2>
        <p className="text-sm text-neutral-500">
          Hover and Tab-focus these — no forced classes.
        </p>
        <div className="flex flex-wrap gap-3 rounded-xl border border-border p-4">
          <Button variant="primary" size="sm">
            Button
          </Button>
          <Button variant="secondary" size="sm">
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Button
          </Button>
          <Button variant="tertiary" size="sm">
            Button
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
          <Button variant="primary" size="sm" disabled>
            Button
          </Button>
          <Button variant="destructive" size="icon-sm" aria-label="Settings">
            <Settings aria-hidden="true" />
          </Button>
        </div>
      </section>
    </main>
  );
}