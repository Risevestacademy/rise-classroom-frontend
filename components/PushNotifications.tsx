"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pushChangedMessage } from "@/lib/push";
import { usePushNotifications } from "@/lib/use-push-notifications";

/* Refetches every notification list when the service worker says a push
   arrived or one was read. */
function useRefreshOnPush(): void {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== pushChangedMessage) return;
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("notifications"),
      });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [queryClient]);
}

/* Sits in every signed-in area. Offers push notifications to a user who
   hasn't answered yet on this browser; the browser's own permission question
   only appears once they say yes. */
export function PushNotifications(): React.JSX.Element | null {
  const push = usePushNotifications();
  useRefreshOnPush();

  if (push.state !== "off" || push.choice !== null) return null;

  return (
    <section
      aria-labelledby="push-prompt-title"
      className="fixed right-4 bottom-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-xl bg-white p-4 shadow-lg sm:right-8 sm:bottom-8"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-brand text-text-brand">
          <Bell className="size-4.5" />
        </span>
        <div className="min-w-0">
          <h2
            id="push-prompt-title"
            className="text-sm font-semibold text-neutral-800"
          >
            Turn on notifications
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Get reminders for classes, assignments and feedback on this device,
            even when Rise Classroom is closed.
          </p>
          {push.failed && (
            <p role="alert" className="mt-2 text-sm text-text-error">
              Notifications couldn&apos;t be turned on. Please try again.
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <Button
          variant="secondary"
          disabled={push.isChanging}
          onClick={push.turnOff}
        >
          Not now
        </Button>
        <Button disabled={push.isChanging} onClick={push.turnOn}>
          {push.isChanging ? "Turning on…" : "Turn on"}
        </Button>
      </div>
    </section>
  );
}

/* The label and action for an account menu's notifications item, or null
   where the browser can't do push at all. */
export function usePushMenuItem(): {
  label: string;
  disabled: boolean;
  onClick: () => void;
} | null {
  const push = usePushNotifications();

  if (!push.state || push.state === "unsupported") return null;
  if (push.state === "blocked") {
    return {
      label: "Notifications blocked in browser",
      disabled: true,
      onClick: () => undefined,
    };
  }
  const isOn = push.state === "on";
  return {
    label: isOn ? "Turn off notifications" : "Turn on notifications",
    disabled: push.isChanging,
    onClick: isOn ? push.turnOff : push.turnOn,
  };
}
