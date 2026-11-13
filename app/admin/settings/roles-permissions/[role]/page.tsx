import { notFound } from "next/navigation";

import { RolePermissions } from "@/components/settings/RolePermissions";
import { findAcademyRole } from "@/lib/role-permissions";

export default async function RolePermissionsPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const role = findAcademyRole((await params).role);
  if (!role) notFound();

  return <RolePermissions role={role} />;
}
