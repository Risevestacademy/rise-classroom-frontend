"use client";

import * as React from "react";

import { AdminTopNav, type Crumb } from "@/components/AdminTopNav";
import { InstructorNavbar } from "@/components/instructor-dashboard/InstructorNavbar";
import { curriculumApis, type CurriculumApi } from "@/features/curriculum/api";
import type { CurriculumRole } from "@/features/curriculum/types";

/** Every route the curriculum screens link to, under one role's section. */
function curriculumPaths(base: string) {
  return {
    list: base,
    detail: (id: string, query?: Record<string, string>) =>
      query ? `${base}/${id}?${new URLSearchParams(query)}` : `${base}/${id}`,
    module: (id: string, moduleId: string) =>
      `${base}/${id}/modules/${moduleId}`,
    editModule: (id: string, moduleId: string) =>
      `${base}/${id}/modules/${moduleId}/edit`,
    newModule: (id: string) => `${base}/${id}/modules/new`,
    newAssignment: (id: string) => `${base}/${id}/assignments/new`,
    newResource: (id: string) => `${base}/${id}/resources/new`,
  };
}

/* What each role may do beyond building curriculum content. */
export type CurriculumPermissions = {
  /* Deleting a whole curriculum. Admins create curricula, so only they remove them. */
  canDeleteCurriculum: boolean;
};

export type CurriculumScope = {
  role: CurriculumRole;
  api: CurriculumApi;
  paths: ReturnType<typeof curriculumPaths>;
  permissions: CurriculumPermissions;
  TopNav: React.ComponentType<{ breadcrumb?: Crumb[] }>;
  /** The section crumbs every curriculum screen's breadcrumb starts with. */
  breadcrumbRoot: Crumb[];
};

const scopes: Record<CurriculumRole, CurriculumScope> = {
  admin: {
    role: "admin",
    api: curriculumApis.admin,
    paths: curriculumPaths("/admin/curriculum"),
    permissions: { canDeleteCurriculum: true },
    TopNav: AdminTopNav,
    breadcrumbRoot: [
      "Academy",
      { label: "Curriculum", href: "/admin/curriculum" },
    ],
  },
  instructor: {
    role: "instructor",
    api: curriculumApis.instructor,
    paths: curriculumPaths("/instructor/curriculum"),
    permissions: { canDeleteCurriculum: false },
    TopNav: InstructorNavbar,
    breadcrumbRoot: [
      "Teaching",
      { label: "Curriculum", href: "/instructor/curriculum" },
    ],
  },
};

const CurriculumScopeContext = React.createContext<CurriculumScope | null>(
  null,
);

/** Set once per role in its curriculum layout; every screen below reads it. */
export function CurriculumScopeProvider({
  role,
  children,
}: {
  role: CurriculumRole;
  children: React.ReactNode;
}) {
  return (
    <CurriculumScopeContext.Provider value={scopes[role]}>
      {children}
    </CurriculumScopeContext.Provider>
  );
}

export function useCurriculumScope() {
  const scope = React.useContext(CurriculumScopeContext);
  if (!scope) {
    throw new Error(
      "useCurriculumScope must be used within CurriculumScopeProvider",
    );
  }
  return scope;
}
