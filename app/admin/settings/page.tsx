import { redirect } from "next/navigation";

import { settingsRoutes } from "@/lib/settings";

export default function SettingsPage() {
  redirect(settingsRoutes.general);
}
