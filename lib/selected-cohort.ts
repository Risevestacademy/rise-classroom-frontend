"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { adminQueries } from "@/lib/admin";

// The cohort picked in the admin top nav, remembered across visits.

const storageKey = "rise.admin.selectedCohortId";
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Keeps other open tabs in step.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readStoredId() {
  try {
    return window.localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

export function setSelectedCohortId(id: string) {
  try {
    window.localStorage.setItem(storageKey, id);
  } catch {
    // Storage can be blocked (e.g. private mode); the pick then lasts this page only.
  }
  listeners.forEach((listener) => listener());
}

/**
 * The selected cohort. Falls back to the first ongoing cohort (then the first
 * one) when nothing was picked yet or the remembered one no longer exists.
 */
export function useSelectedCohort() {
  const cohortsQuery = useQuery(adminQueries.cohorts());
  const storedId = React.useSyncExternalStore(subscribe, readStoredId, () => "");
  const cohorts = cohortsQuery.data ?? [];
  const cohort =
    cohorts.find((c) => c.id === storedId) ??
    cohorts.find((c) => c.status === "ONGOING") ??
    cohorts[0];

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
