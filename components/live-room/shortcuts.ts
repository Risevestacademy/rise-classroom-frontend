"use client";

import * as React from "react";

export type ShortcutAction = "mic" | "camera" | "share" | "hand" | "chat" | "participants" | "help";

/** Meet's keys where it has them: ⌘/Ctrl for media, with ⌃/Alt added for the rest. */
export const shortcuts: { action: ShortcutAction; label: string; key: string; extra?: boolean }[] = [
  { action: "mic", label: "Turn microphone on or off", key: "D" },
  { action: "camera", label: "Turn camera on or off", key: "E" },
  { action: "share", label: "Start or stop presenting", key: "S", extra: true },
  { action: "hand", label: "Raise or lower your hand", key: "H", extra: true },
  { action: "chat", label: "Open or close the chat", key: "C", extra: true },
  { action: "participants", label: "Open or close participants", key: "P", extra: true },
  { action: "help", label: "Show keyboard shortcuts", key: "?" },
];

const onMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);
const noSubscription = () => () => {};

/** Whether to show ⌘ and ⌃ rather than Ctrl and Alt. */
export function useOnMac() {
  return React.useSyncExternalStore(noSubscription, onMac, () => false);
}

/** "Ctrl + Alt + H", or "⌃ ⌘ H" on a Mac. */
export function shortcutKeys(action: ShortcutAction, mac: boolean) {
  const shortcut = shortcuts.find((item) => item.action === action)!;
  if (action === "help") return ["Shift", "?"];
  if (mac) return shortcut.extra ? ["⌃", "⌘", shortcut.key] : ["⌘", shortcut.key];
  return shortcut.extra ? ["Ctrl", "Alt", shortcut.key] : ["Ctrl", shortcut.key];
}

/** The same keys in `aria-keyshortcuts` form. */
export function ariaShortcut(action: ShortcutAction, mac: boolean) {
  const shortcut = shortcuts.find((item) => item.action === action)!;
  if (action === "help") return "Shift+?";
  if (mac) return shortcut.extra ? `Control+Meta+${shortcut.key}` : `Meta+${shortcut.key}`;
  return shortcut.extra ? `Control+Alt+${shortcut.key}` : `Control+${shortcut.key}`;
}

/** Adds the keys to a button's label, e.g. "Turn off microphone (Ctrl + D)". */
export const withShortcut = (label: string, action: ShortcutAction, mac: boolean) =>
  `${label} (${shortcutKeys(action, mac).join(mac ? " " : " + ")})`;

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

function matches(event: KeyboardEvent, mac: boolean): ShortcutAction | null {
  if (event.key === "?" && !event.ctrlKey && !event.metaKey && !event.altKey && !typing(event.target)) return "help";
  if (event.shiftKey) return null;
  const letter = event.code.startsWith("Key") ? event.code.slice(3) : "";
  const shortcut = shortcuts.find((item) => item.key === letter);
  if (!shortcut) return null;
  const extra = mac ? event.ctrlKey : event.altKey;
  const main = mac ? event.metaKey && !event.altKey : event.ctrlKey && !event.metaKey;
  return main && extra === Boolean(shortcut.extra) ? shortcut.action : null;
}

/** Runs the room's keyboard shortcuts while it's open. */
export function useRoomShortcuts(handlers: Partial<Record<ShortcutAction, () => void>>) {
  const latest = React.useRef(handlers);
  React.useEffect(() => {
    latest.current = handlers;
  });

  React.useEffect(() => {
    const mac = onMac();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      const action = matches(event, mac);
      const run = action && latest.current[action];
      if (!run) return;
      // Ctrl + D would bookmark the page and Ctrl + E would jump to the address bar.
      event.preventDefault();
      run();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
