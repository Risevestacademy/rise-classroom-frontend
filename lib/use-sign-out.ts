"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { signOut } from "@/lib/auth";
import { disablePush } from "@/lib/push";

/**
 * Ends the session and leaves the signed-in area. The local cache is wiped and
 * the user sent to sign-in even if the request fails — someone who asked to
 * sign out shouldn't be left looking at the previous account's data.
 */
export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    /* This browser stops receiving the account's notifications first, while
       the session can still tell the API. Signing out goes ahead regardless. */
    mutationFn: async () => {
      await disablePush().catch(() => undefined);
      return signOut();
    },
    onSettled: () => {
      queryClient.clear();
      router.replace("/sign-in");
    },
  });
}
