"use client";

import * as React from "react";

type ItemDragEvent = React.DragEvent<HTMLElement>;

export type DragReorder<T> = {
  /* The items in the order they're being dragged into. Render these. */
  ordered: T[];
  draggingId: string | null;
  handleProps: (id: string) => {
    draggable: true;
    onDragStart: (event: ItemDragEvent) => void;
    onDragEnd: () => void;
  };
  itemProps: (id: string) => {
    "data-drag-item": string;
    onDragOver: (event: ItemDragEvent) => void;
  };
};

/* Puts one item where another is. */
export function moveItem<T extends { id: string }>(
  items: T[],
  fromId: string,
  toId: string,
): T[] {
  const from = items.find((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);
  if (!from || toIndex === -1 || fromId === toId) return items;

  const next = items.filter((item) => item.id !== fromId);
  next.splice(toIndex, 0, from);
  return next;
}

function startDrag(event: ItemDragEvent, id: string): void {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", id);
  /* Drags the whole item along, not just its grip. */
  const item = event.currentTarget.closest("[data-drag-item]");
  if (item) event.dataTransfer.setDragImage(item, 16, 16);
}

/* Drag-to-reorder for a list. Spread `handleProps(id)` on an item's grip and
   `itemProps(id)` on the item itself, and render `ordered`: the items shift
   as one is dragged over the others, and `onReorder` gets the new order once
   it's let go. `move` changes how an item takes another's place. */
export function useDragReorder<T extends { id: string }>({
  items,
  onReorder,
  move = moveItem,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  move?: (items: T[], fromId: string, toId: string) => T[];
}): DragReorder<T> {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<T[] | null>(null);
  const ordered = preview ?? items;

  return {
    ordered,
    draggingId,
    handleProps: (id) => ({
      draggable: true,
      onDragStart: (event) => {
        startDrag(event, id);
        setDraggingId(id);
      },
      onDragEnd: () => {
        if (preview) onReorder(preview);
        setDraggingId(null);
        setPreview(null);
      },
    }),
    itemProps: (id) => ({
      "data-drag-item": "",
      onDragOver: (event) => {
        if (!draggingId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        if (draggingId !== id) setPreview(move(ordered, draggingId, id));
      },
    }),
  };
}
