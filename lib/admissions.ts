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
  cohortsOpen: false,
  cohort: { name: "Cohort 3" },
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

/** What someone fills in on the landing page's last screen. */
export type SeatRequest = {
  name: string;
  email: string;
  track: string;
  /** The cohort they're joining the waitlist for, or applying to. */
  cohort: string | null;
};

const MOCK_LATENCY_MS = 1200;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Puts someone on the waitlist. Mock: waits as a real request would, then succeeds. */
export async function joinWaitlist(request: SeatRequest): Promise<void> {
  // Later: await api.post("/admissions/waitlist", { body: request });
  void request;
  await wait(MOCK_LATENCY_MS);
}

/*
 * The thank-you page shows back what someone just signed up with. It's kept
 * for this tab only, never in the URL, so their email isn't left in history
 * or shared links.
 */
const RECEIPT_KEY = "rise-academy:waitlist";

export function saveWaitlistReceipt(request: SeatRequest) {
  try {
    sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(request));
  } catch {
    // Storage can be blocked; the thank-you page has a version without details.
  }
}

/** The saved receipt as stored, so React can compare it between renders. */
export function readWaitlistReceiptRaw(): string | null {
  try {
    return sessionStorage.getItem(RECEIPT_KEY);
  } catch {
    return null;
  }
}

export function parseWaitlistReceipt(raw: string | null): SeatRequest | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SeatRequest;
  } catch {
    return null;
  }
}

/** Starts someone's application. Mock: waits as a real request would, then succeeds. */
export async function startApplication(request: SeatRequest): Promise<void> {
  // Later: await api.post("/admissions/applications", { body: request });
  void request;
  await wait(MOCK_LATENCY_MS);
}
