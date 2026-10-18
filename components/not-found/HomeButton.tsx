"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { landingPathFor } from "@/lib/auth";
import { sessionQuery } from "@/lib/session-query";

/** Signed-in users go to their dashboard; everyone else to the landing page. */
export function HomeButton() {
  const { data: session } = useQuery(sessionQuery());
  const user = session?.user;

  return (
    <Button
      variant="primary"
      size="lg"
      nativeButton={false}
      render={<Link href={user ? landingPathFor(user) : "/"} />}
      className="text-base"
    >
      Take me Home
    </Button>
  );
}
