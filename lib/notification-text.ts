/** An ISO timestamp, such as "2026-11-23T23:00:00.000Z", inside some text. */
const TIMESTAMP =
  /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})\b/g;

const readable = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * Notification text with any timestamp shown in the reader's own time zone.
 * The backend writes times into live session notifications as raw UTC
 * ("… is scheduled for 2026-11-23T23:00:00.000Z."), which reads as
 * "… is scheduled for Mon, Nov 23, 11:00 PM." in Lagos instead.
 */
export function notificationText(text: string) {
  return text.replace(TIMESTAMP, (stamp) => {
    const date = new Date(stamp);
    return Number.isNaN(date.getTime()) ? stamp : readable.format(date);
  });
}
