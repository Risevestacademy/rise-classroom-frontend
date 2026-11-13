import Link from "next/link";

import { ArrowLeft01, ArrowRight01 } from "@/assets/icons";
import { cn } from "@/lib/utils";

export const settingsCardClass =
  "rounded-2xl bg-surface-default shadow-[0_1px_2px_rgb(0_0_0/0.08)]";

/* The raised grey surface of the appearance page's buttons. */
export const settingsControlClass =
  "rounded-lg bg-surface-subtle shadow-[0_1px_2px_rgb(0_0_0/0.08)]";

/* The filled, borderless look the settings pages give a select. */
export const settingsSelectClass =
  "h-9 border-transparent bg-surface-subtle px-2.5 hover:bg-neutral-200";

/* The heading at the top of every settings page. A page inside another
   passes `backHref` and names its parent, e.g. "Roles & Permissions / Admin". */
export function SettingsPageTitle({
  backHref,
  backLabel,
  children,
}: {
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const heading = (
    <h2 className="text-2xl font-semibold text-text-primary">{children}</h2>
  );
  if (!backHref) return heading;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={backHref}
        aria-label={backLabel ?? "Back"}
        className="-ml-1 flex size-6 shrink-0 items-center justify-center rounded-md text-icon-primary hover:bg-surface-subtle xl:-ml-8"
      >
        <ArrowLeft01 className="size-5" />
      </Link>
      {heading}
    </div>
  );
}

/* A titled group of settings inside a white card. */
export function SettingsSection({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="mt-8">
      <h3 className="text-lg font-medium text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 font-work text-sm text-text-secondary">
          {description}
        </p>
      )}
      <div
        className={cn(
          settingsCardClass,
          "mt-3 flex max-w-[609px] flex-col gap-5 px-4 py-6",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}

/* A white card that carries its own title, for pages made of several. */
export function SettingsCard({
  title,
  description,
  action,
  titleId,
  children,
}: {
  title: string;
  description: string;
  /* Sits opposite the title, e.g. a switch that turns the card's settings on. */
  action?: React.ReactNode;
  titleId?: string;
  children?: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className={cn(settingsCardClass, "mt-6 max-w-[609px] p-4")}>
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="min-w-0">
          <h3 id={titleId} className="text-base text-text-primary">
            {title}
          </h3>
          <p className="mt-1 font-work text-xs text-text-secondary">
            {description}
          </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}

/* One setting: its name and what it does on the left, its control on the right. */
export function SettingsRow({
  label,
  description,
  labelId,
  children,
}: {
  label: string;
  description: string;
  /* Lets the control name itself after the label. */
  labelId?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p id={labelId} className="text-base text-text-primary">
          {label}
        </p>
        <p className="mt-1 font-work text-xs text-text-secondary">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-6">{children}</div>
    </div>
  );
}

/* A row that opens another settings page. */
export function SettingsLinkRow({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description?: string;
}): React.JSX.Element {
  return (
    <Link
      href={href}
      className="-mx-2 flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-1.5 outline-none hover:bg-surface-subtle focus-visible:bg-surface-subtle"
    >
      <span className="min-w-0">
        <span className="block text-base text-text-primary">{label}</span>
        {description && (
          <span className="mt-1 block font-work text-xs text-text-secondary">
            {description}
          </span>
        )}
      </span>
      <ArrowRight01 className="size-5 shrink-0 text-icon-primary" />
    </Link>
  );
}
