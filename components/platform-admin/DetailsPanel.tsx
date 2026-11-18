"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/* An approved academy whose super admin hasn't finished setting up, in the
   purple the dashboard's Awaiting set-up figure uses. */
export function AwaitingSetupBadge(): React.JSX.Element {
  return (
    <Badge variant="light" className="bg-[#fdeafc] text-[#960b93]">
      Awaiting set-up
    </Badge>
  );
}

/* The panel that slides in from the right with one record's details. Pass no
   children while nothing is selected; `footer` holds the record's actions. */
export function DetailsPanel({
  title,
  open,
  onClose,
  footer,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40" />
        <Dialog.Popup className="fixed top-[80px] right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-[414px] flex-col rounded-2xl bg-neutral-100 outline-none transition-transform duration-200 data-[ending-style]:translate-x-[110%] data-[starting-style]:translate-x-[110%]">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-6">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <Dialog.Title className="text-xl font-semibold text-text-primary">
                {title}
              </Dialog.Title>
              <Dialog.Close
                aria-label={`Close ${title.toLowerCase()}`}
                className="rounded-md p-1 text-text-primary hover:bg-neutral-200"
              >
                <X className="size-5" />
              </Dialog.Close>
            </div>
            {children}
          </div>
          {footer && (
            <div className="flex flex-wrap justify-end gap-3 px-6 py-6">
              {footer}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function PanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="flex flex-col gap-4 border-b border-border-default py-6 last:border-b-0">
      <h3 className="text-base font-medium text-text-primary">{title}</h3>
      {children}
    </section>
  );
}

export function PanelField({
  label,
  value,
  align = "start",
}: {
  label: string;
  value: React.ReactNode;
  align?: "start" | "end";
}): React.JSX.Element {
  return (
    <div
      className={
        align === "end"
          ? "flex min-w-0 flex-col items-end text-right"
          : "flex min-w-0 flex-col"
      }
    >
      <span className="font-work text-xs text-text-secondary">{label}</span>
      <span className="max-w-full font-work text-sm break-words text-text-primary">
        {value}
      </span>
    </div>
  );
}

/* The four facts the sign-up form collects about an academy. */
export function AcademyFacts({
  name,
  website,
  learningSpace,
  learners,
}: {
  name: string;
  website: string | null;
  learningSpace: string;
  learners: string;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      <PanelField label="Academy name" value={name} />
      <PanelField label="Website" value={website ?? "--"} align="end" />
      <PanelField label="Learning space type" value={learningSpace} />
      <PanelField label="Estimated learners" value={learners} align="end" />
    </div>
  );
}
