"use client";

import { useRouter } from "next/navigation";

import { PreJoinScreen, saveChoices } from "./PreJoinScreen";

/** The device check inside the app; joining opens the full-screen room. */
export function DeviceCheck({
  sessionId,
  title,
  when,
  userName,
  userKey,
}: {
  sessionId: string;
  title: string;
  when: string;
  userName: string;
  userKey: string;
}) {
  const router = useRouter();

  return (
    <PreJoinScreen
      title={title}
      when={when}
      userName={userName}
      userKey={userKey}
      joining={false}
      onJoin={(choices) => {
        saveChoices(choices);
        router.push(`/live/${sessionId}?ready=1`);
      }}
    />
  );
}
