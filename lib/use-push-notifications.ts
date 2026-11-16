"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { landingPathFor } from "@/lib/auth";
import {
  disablePush,
  enablePush,
  getPushState,
  readPushChoice,
  restorePush,
  writePushChoice,
  type PushChoice,
  type PushState,
} from "@/lib/push";
import { sessionQuery } from "@/lib/session-query";

type PushStatus = { state: PushState; choice: PushChoice | null };

export type PushNotifications = {
  /* Undefined until the browser has been asked, which only happens once the
     page is in the browser and the user is known. */
  state: PushState | undefined;
  /* What the user last chose here; null until they answer the prompt. */
  choice: PushChoice | null;
  isChanging: boolean;
  failed: boolean;
  turnOn: () => void;
  turnOff: () => void;
};

const pushKey = (userId?: string) => ["push-notifications", userId] as const;

/* Push notifications for the signed-in user on this browser. */
export function usePushNotifications(): PushNotifications {
  const queryClient = useQueryClient();
  const { data: session } = useQuery(sessionQuery());
  const user = session?.user;
  const queryKey = pushKey(user?.id);

  const status = useQuery({
    queryKey,
    enabled: Boolean(user),
    staleTime: Infinity,
    queryFn: async (): Promise<PushStatus> => {
      if (!user) return { state: "unsupported", choice: null };
      /* A failed restore leaves notifications off, where they can be turned
         on again by hand. */
      await restorePush(user.id, landingPathFor(user)).catch(() => undefined);
      return { state: await getPushState(), choice: readPushChoice(user.id) };
    },
  });

  const change = useMutation({
    mutationFn: async (choice: PushChoice): Promise<PushStatus> => {
      if (!user) throw new Error("Not signed in");
      if (choice === "off") {
        writePushChoice(user.id, "off");
        await disablePush();
        return { state: await getPushState(), choice };
      }
      const state = await enablePush(landingPathFor(user));
      /* Closing the browser's question without answering isn't a choice. */
      if (state === "on") writePushChoice(user.id, "on");
      return { state, choice: readPushChoice(user.id) };
    },
    onSuccess: (next) => queryClient.setQueryData(queryKey, next),
  });

  return {
    state: status.data?.state,
    choice: status.data?.choice ?? null,
    isChanging: change.isPending,
    failed: change.isError,
    turnOn: () => change.mutate("on"),
    turnOff: () => change.mutate("off"),
  };
}
