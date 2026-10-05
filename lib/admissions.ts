import { queryOptions } from "@tanstack/react-query";

/** Whether a cohort is taking applications, and which one. */
export type Admissions = {
  cohortsOpen: boolean;
  /** The cohort that's open, or the next one to open. Null if none is planned yet. */
  cohort: { name: string } | null;
};

/*
 * Mock until the backend has an admissions endpoint. Flip `cohortsOpen` to
 * see the landing page switch between applying and the waitlist.
 */
const MOCK_ADMISSIONS: Admissions = {
  cohortsOpen: true,
  cohort: { name: "Cohort 2027" },
};

async function getAdmissions(): Promise<Admissions> {
  // Later: const { data } = await api.get<Envelope<Admissions>>("/admissions");
  return MOCK_ADMISSIONS;
}

export const admissionsQuery = () =>
  queryOptions({
    queryKey: ["admissions"] as const,
    queryFn: getAdmissions,
    staleTime: 5 * 60_000,
  });
