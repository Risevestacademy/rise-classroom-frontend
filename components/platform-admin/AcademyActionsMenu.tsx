"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { MoreHorizontal } from "lucide-react";

import { AcademyStatusDialog } from "@/components/platform-admin/AcademyStatusDialog";
import type { Academy } from "@/lib/platform";

const itemClass =
  "flex cursor-pointer rounded-md px-3 py-2 text-neutral-700 outline-none data-highlighted:bg-neutral-100";

export function AcademyActionsMenu({
  academy,
  onView,
}: {
  academy: Academy;
  onView?: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const suspended = academy.status === "SUSPENDED";

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          aria-label={`${academy.name} actions`}
          className="rounded-md p-1 text-neutral-800 hover:bg-neutral-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={6} className="z-50">
            <Menu.Popup className="w-44 rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg outline-none">
              {onView && (
                <Menu.Item onClick={onView} className={itemClass}>
                  View details
                </Menu.Item>
              )}
              <Menu.Item onClick={() => setConfirming(true)} className={itemClass}>
                {suspended ? "Reactivate academy" : "Suspend academy"}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <AcademyStatusDialog
        academy={academy}
        open={confirming}
        onOpenChange={setConfirming}
      />
    </>
  );
}
