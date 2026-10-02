"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { signOut } from "@/lib/auth";

/**
 * Ends the session and leaves the signed-in area. The local cache is wiped and
 * the user sent to sign-in even if the request fails — someone who asked to
 * sign out shouldn't be left looking at the previous account's data.
 */
export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSettled: () => {
      queryClient.clear();
      router.replace("/sign-in");
    },
  });
}
