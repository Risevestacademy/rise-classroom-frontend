import type { Metadata } from "next";

import { WaitlistJoined } from "@/components/landing/WaitlistJoined";

export const metadata: Metadata = {
  title: "You're on the waitlist · Rise Academy",
  // A thank-you page, not something to find from search.
  robots: { index: false, follow: false },
};

export default function WaitlistJoinedPage() {
  return <WaitlistJoined />;
}
