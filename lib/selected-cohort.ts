"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { adminQueries } from "@/lib/admin";
import { pickCohort, SELECTED_COHORT_COOKIE } from "@/lib/selected-cohort-pick";

// The cohort picked in the admin top nav, remembered across visits. It lives
// in a cookie so the server can render with it; localStorage only carries the
// change to other open tabs, which get a "storage" event.

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readCookie() {
  const prefix = `${SELECTED_COHORT_COOKIE}=`;
  const entry = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : "";
}

function writeCookie(id: string) {
  document.cookie = `${SELECTED_COHORT_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`;
}

function readStoredId() {
  const id = readCookie();
  if (id) return id;
  // Picks made before the cookie existed were only in localStorage.
  try {
    const legacy = window.localStorage.getItem(SELECTED_COHORT_COOKIE) ?? "";
    if (legacy) writeCookie(legacy);
    return legacy;
  } catch {
    return "";
  }
}

export function setSelectedCohortId(id: string) {
  writeCookie(id);
  try {
    window.localStorage.setItem(SELECTED_COHORT_COOKIE, id);
  } catch {
    // Storage can be blocked (e.g. private mode); other tabs then catch up on reload.
  }
  listeners.forEach((listener) => listener());
}

/** The picked cohort id the server read from the cookie, for the first render. */
const ServerCohortIdContext = React.createContext("");

export function SelectedCohortProvider({
  initialId,
  children,
}: {
  initialId: string;
  children: React.ReactNode;
}) {
  return React.createElement(
    ServerCohortIdContext.Provider,
    { value: initialId },
    children,
  );
}

/**
 * The selected cohort. Falls back to the first ongoing cohort (then the first
 * one) when nothing was picked yet or the remembered one no longer exists.
 */
export function useSelectedCohort() {
  const serverId = React.useContext(ServerCohortIdContext);
  const cohortsQuery = useQuery(adminQueries.cohorts());
  const storedId = React.useSyncExternalStore(
    subscribe,
    readStoredId,
    () => serverId,
  );
  const cohorts = cohortsQuery.data ?? [];
  const cohort = pickCohort(cohorts, storedId);

  return {
    cohort,
    cohorts,
    cohortsQuery,
    /** Pages scope their requests to this; undefined means every cohort. */
    cohortId: cohort?.id,
    /** False until the cohort list loads, so pages don't fetch twice. */
    isReady: !cohortsQuery.isPending,
  };
}
