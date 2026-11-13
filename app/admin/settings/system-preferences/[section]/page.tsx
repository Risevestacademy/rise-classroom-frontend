import { notFound } from "next/navigation";

import { SystemPreferencePage } from "@/components/settings/SystemPreferencePages";
import { findSystemPreferencePage } from "@/lib/system-preferences";

export default async function SystemPreferenceSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const page = findSystemPreferencePage((await params).section);
  if (!page) notFound();

  return <SystemPreferencePage page={page} />;
}
