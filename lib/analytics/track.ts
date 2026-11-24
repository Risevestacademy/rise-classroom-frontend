import Clarity from "@microsoft/clarity";

/**
 * Records a named product event in Clarity. Does nothing where analytics isn't
 * set up, and never lets a tracking failure reach the page.
 */
export function track(event: string) {
  if (!process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID) return;
  try {
    Clarity.event(event);
  } catch {
    // Clarity hasn't loaded yet; the event is not worth retrying.
  }
}
