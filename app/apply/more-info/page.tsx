import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthShell } from "@/components/AuthShell";
import { MoreInfo } from "./MoreInfo";

export const metadata: Metadata = {
  title: "More information needed",
  description: "Answer a question about your Rise Classroom application.",
  /* Each link is private to one applicant. */
  robots: { index: false, follow: false },
};

/* Where the "more info needed" email sends an applicant, with the link's token
   in the query string. */
export default function MoreInfoPage() {
  return (
    <AuthShell panel="plain">
      <Suspense fallback={null}>
        <MoreInfo />
      </Suspense>
    </AuthShell>
  );
}
