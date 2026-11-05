"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

/**
 * The page's `?tab=`, one of `tabs`, or the first tab. Changing it updates
 * the URL in place without asking the server to render the page again, so
 * tabs switch instantly and the back button isn't filled with tab clicks.
 */
export function useTabParam<T extends string>(tabs: readonly { value: T }[]) {
  const value = useSearchParams().get("tab");
  const tab = tabs.find((item) => item.value === value)?.value ?? tabs[0].value;

  const setTab = React.useCallback((next: T) => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", next);
    // Each tab's list starts on its first page; the page size carries over.
    params.delete("page");
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, []);

  return [tab, setTab] as const;
}
