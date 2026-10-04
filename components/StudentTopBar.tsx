"use client";

import { Menu } from "lucide-react";

import { Logo } from "@/assets/logo";
import { useStudentNav } from "@/components/StudentNavContext";

/** Mobile-only header that exposes the sidebar toggle; the sidebar itself is
 * always visible at `lg` and up, so this bar has nothing to show there. */
export function StudentTopBar() {
  const { setOpen } = useStudentNav();

  return (
    <header className="flex h-16 items-center gap-3 border-b border-neutral-200 bg-white px-4 lg:hidden">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="text-neutral-400 hover:text-neutral-600"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Logo variant="teal" size="sm" />
    </header>
  );
}
