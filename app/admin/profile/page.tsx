import { redirect } from "next/navigation";

import { profileRoutes } from "@/lib/profile";

export default function ProfilePage() {
  redirect(profileRoutes.academy);
}
