"use client";

import * as React from "react";
import { Laptop } from "lucide-react";

import { Moon02, Sun01 } from "@/assets/icons";
import { SettingsSwitch } from "@/components/settings/SettingsControls";
import {
  SettingsPageTitle,
  SettingsRow,
  SettingsSection,
  settingsControlClass,
} from "@/components/settings/SettingsSection";
import { WorkspaceThemePicker } from "@/components/settings/WorkspaceThemePicker";
import { workspaceThemes, type InterfaceTheme } from "@/lib/settings";
import { cn } from "@/lib/utils";

const interfaceThemes: {
  value: InterfaceTheme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "system", label: "System", icon: Laptop },
  { value: "light", label: "Light", icon: Sun01 },
  { value: "dark", label: "Dark", icon: Moon02 },
];

export function AppearanceSettings(): React.JSX.Element {
  /* No backend yet */
  const [interfaceTheme, setInterfaceTheme] =
    React.useState<InterfaceTheme>("light");
  const [workspaceTheme, setWorkspaceTheme] = React.useState(
    workspaceThemes[0].id,
  );
  const [reduceMotion, setReduceMotion] = React.useState(true);

  return (
    <>
      <SettingsPageTitle>Appearance</SettingsPageTitle>

      <SettingsSection title="Theme">
        <SettingsRow
          label="Interface theme"
          description="Choose a preferred interface mode."
          labelId="interface-theme-label"
        >
          <InterfaceThemeControl
            aria-labelledby="interface-theme-label"
            value={interfaceTheme}
            onChange={setInterfaceTheme}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Workspace theme">
        <SettingsRow
          label="Customize your workspace"
          description="Choose a color theme for your workspace."
        >
          <WorkspaceThemePicker
            value={workspaceTheme}
            onChange={setWorkspaceTheme}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Motion">
        <SettingsRow
          label="Reduce motion"
          description="Minimize animations and transitions"
          labelId="reduce-motion-label"
        >
          <SettingsSwitch
            aria-labelledby="reduce-motion-label"
            checked={reduceMotion}
            onCheckedChange={setReduceMotion}
          />
        </SettingsRow>
      </SettingsSection>
    </>
  );
}

function InterfaceThemeControl({
  value,
  onChange,
  "aria-labelledby": ariaLabelledBy,
}: {
  value: InterfaceTheme;
  onChange: (value: InterfaceTheme) => void;
  "aria-labelledby": string;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
      className={cn(settingsControlClass, "inline-flex gap-1 p-1")}
    >
      {interfaceThemes.map(({ value: theme, label, icon: Icon }) => (
        <button
          key={theme}
          type="button"
          role="radio"
          aria-checked={value === theme}
          onClick={() => onChange(theme)}
          className={cn(
            "flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 font-work text-sm font-medium text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
            value === theme ? "bg-surface-default" : "hover:bg-neutral-200",
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
