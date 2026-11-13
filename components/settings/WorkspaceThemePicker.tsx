"use client";

import * as React from "react";
import { Popover } from "@base-ui/react/popover";
import { Palette } from "lucide-react";

import { settingsControlClass } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import { workspaceThemes } from "@/lib/settings";
import { cn } from "@/lib/utils";

/* "Edit theme" opens the colour choices; nothing changes until Done. */
export function WorkspaceThemePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [picked, setPicked] = React.useState(value);

  const done = () => {
    onChange(picked);
    setOpen(false);
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setPicked(value);
        setOpen(next);
      }}
    >
      <Popover.Trigger
        className={cn(
          settingsControlClass,
          "flex h-10 cursor-pointer items-center gap-1.5 px-4 font-work text-sm font-medium text-text-primary outline-none hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-border-focus",
        )}
      >
        <Palette className="size-4" />
        Edit theme
      </Popover.Trigger>
      <ThemePopup onCancel={() => setOpen(false)} onDone={done}>
        <ThemeSwatches value={picked} onChange={setPicked} />
      </ThemePopup>
    </Popover.Root>
  );
}

function ThemePopup({
  onCancel,
  onDone,
  children,
}: {
  onCancel: () => void;
  onDone: () => void;
  children: React.ReactNode;
}) {
  return (
    <Popover.Portal>
      <Popover.Positioner
        side="top"
        align="end"
        sideOffset={8}
        className="z-50 outline-none"
      >
        <Popover.Popup className="w-[calc(100vw-2rem)] max-w-86 rounded-lg bg-surface-subtle p-3 shadow-[0_2px_6px_rgb(0_0_0/0.19),0_0_1px_rgb(0_0_0/0.25)] outline-none">
          <Popover.Title className="text-lg font-medium text-text-primary">
            Theme
          </Popover.Title>
          {children}
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onDone}>Done</Button>
          </div>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
}

function ThemeSwatches({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Workspace theme"
      className="mt-3 flex flex-wrap gap-4"
    >
      {workspaceThemes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          role="radio"
          aria-checked={value === theme.id}
          aria-label={theme.name}
          onClick={() => onChange(theme.id)}
          className={cn(
            "flex size-10 cursor-pointer items-center justify-center rounded-full bg-surface-default outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
            value === theme.id && "ring-2 ring-border-focus",
          )}
        >
          {/* A pie in the theme's colour with one lighter quarter. */}
          <span
            className="size-8 rounded-full"
            style={{
              background: `conic-gradient(color-mix(in srgb, ${theme.color} 25%, white) 0 25%, ${theme.color} 25% 100%)`,
            }}
          />
        </button>
      ))}
    </div>
  );
}
