"use client";

import * as React from "react";

const subscribe = (onChange: () => void) => {
  const timer = setInterval(onChange, 15_000);
  return () => clearInterval(timer);
};
const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000;

/**
 * The time, kept to the minute, for "Live now" and "In 5 minutes" labels.
 * `serverNow` (or `null`) is used while rendering on the server.
 */
export function useCurrentMinute(serverNow: number): number;
export function useCurrentMinute(): number | null;
export function useCurrentMinute(serverNow: number | null = null) {
  return React.useSyncExternalStore(subscribe, currentMinute, () => serverNow);
}
