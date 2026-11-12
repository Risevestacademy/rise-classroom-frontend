"use client";

import * as React from "react";

/**
 * Ticked table rows, kept by id so a selection survives moving between pages.
 * The rows themselves are kept too, for actions on rows no longer on screen.
 */
export function useRowSelection<T>(getId: (row: T) => string) {
  const [selected, setSelected] = React.useState<Map<string, T>>(
    () => new Map(),
  );

  const isSelected = (row: T) => selected.has(getId(row));

  function toggle(row: T, checked: boolean) {
    setSelected((current) => {
      const next = new Map(current);
      if (checked) next.set(getId(row), row);
      else next.delete(getId(row));
      return next;
    });
  }

  /** Ticks every row given, or unticks them all when they're already ticked. */
  function toggleAll(rows: T[]) {
    const all = rows.length > 0 && rows.every(isSelected);
    setSelected((current) => {
      const next = new Map(current);
      for (const row of rows) {
        if (all) next.delete(getId(row));
        else next.set(getId(row), row);
      }
      return next;
    });
  }

  const clear = React.useCallback(() => setSelected(new Map()), []);

  /** Header checkbox state for the rows on screen. */
  function headerState(rows: T[]) {
    const all = rows.length > 0 && rows.every(isSelected);
    return { checked: all, indeterminate: !all && rows.some(isSelected) };
  }

  return {
    items: [...selected.values()],
    count: selected.size,
    isSelected,
    toggle,
    toggleAll,
    clear,
    headerState,
  };
}

export type RowSelection<T> = ReturnType<typeof useRowSelection<T>>;
