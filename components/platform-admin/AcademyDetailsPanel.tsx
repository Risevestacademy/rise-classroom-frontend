"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import { PersonAvatar } from "@/components/PersonAvatar";
import { AcademyStatusDialog } from "@/components/platform-admin/AcademyStatusDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { shortDate } from "@/lib/calendar";
import { setupAdmin, type Academy } from "@/lib/platform";

/* PENDING-BACKEND: the API has no website, learning space type, learner estimate,
   application date or last active date for an academy, so those show "--". */
const notAvailable = "--";

export function AcademyDetailsPanel({
  academy,
  onClose,
}: {
  academy: Academy | null;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);

  return (
    <Dialog.Root open={academy !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40" />
        <Dialog.Popup className="fixed top-[80px] right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-[414px] flex-col rounded-2xl bg-neutral-100 shadow-[0_8px_24px_rgba(16,24,40,0.08)] outline-none transition-transform duration-200 data-[ending-style]:translate-x-[110%] data-[starting-style]:translate-x-[110%]">
          {academy && (
            <>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-6">
                <div className="flex items-center justify-between border-b border-border-default pb-3">
                  <Dialog.Title className="text-xl font-semibold text-text-primary">
                    Academy details
                  </Dialog.Title>
                  <Dialog.Close
                    aria-label="Close academy details"
                    className="rounded-md p-1 text-text-primary hover:bg-neutral-200"
                  >
                    <X className="size-5" />
                  </Dialog.Close>
                </div>

                <div className="flex items-center gap-3 border-b border-border-default py-4">
                  <PersonAvatar name={academy.name} colorKey={academy.id} size={40} />
                  <p className="min-w-0 flex-1 truncate font-work text-sm font-medium text-text-primary">
                    {academy.name}
                  </p>
                  <StatusBadge academy={academy} />
                </div>

                <Section title="Academy information">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <Field label="Academy name" value={academy.name} />
                    <Field label="Website" value={notAvailable} align="end" />
                    <Field label="Learning space type" value={notAvailable} />
                    <Field label="Estimated learners" value={notAvailable} align="end" />
                  </div>
                </Section>

                <Section title="Super Admin">
                  <SuperAdmin academy={academy} />
                </Section>

                <Section title="Account information">
                  <div className="flex flex-col gap-3">
                    <Field label="Date applied" value={notAvailable} />
                    <Field label="Date created" value={shortDate(new Date(academy.createdAt))} />
                    <Field label="Last active" value={notAvailable} />
                  </div>
                </Section>
              </div>

              <div className="flex justify-end px-6 py-6">
                <Button
                  variant={academy.status === "SUSPENDED" ? "primary" : "destructive"}
                  size="lg"
                  onClick={() => setConfirming(true)}
                >
                  {academy.status === "SUSPENDED" ? "Reactivate academy" : "Suspend academy"}
                </Button>
              </div>

              <AcademyStatusDialog
                academy={academy}
                open={confirming}
                onOpenChange={setConfirming}
              />
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function StatusBadge({ academy }: { academy: Academy }) {
  const suspended = academy.status === "SUSPENDED";
  return (
    <Badge variant="light" status={suspended ? "error" : "success"}>
      {suspended ? "Suspended" : "Active"}
    </Badge>
  );
}

function SuperAdmin({ academy }: { academy: Academy }) {
  const admin = setupAdmin(academy) ?? academy.admins[0];
  if (!admin) {
    return <p className="font-work text-sm text-text-secondary">{notAvailable}</p>;
  }

  const name = `${admin.firstName} ${admin.lastName}`;
  return (
    <div className="flex items-center gap-3">
      <PersonAvatar name={name} colorKey={admin.id} size={40} />
      <div className="min-w-0">
        <p className="truncate font-work text-sm font-medium text-text-primary">{name}</p>
        <p className="truncate font-work text-xs text-text-secondary">{admin.email}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-border-default py-6 last:border-b-0">
      <h3 className="text-base font-medium text-text-primary">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  align = "start",
}: {
  label: string;
  value: React.ReactNode;
  align?: "start" | "end";
}) {
  return (
    <div className={align === "end" ? "flex flex-col items-end text-right" : "flex flex-col"}>
      <span className="font-work text-xs text-text-secondary">{label}</span>
      <span className="font-work text-sm text-text-primary">{value}</span>
    </div>
  );
}
