export { cn } from "cn"

/** `null` means the size isn't known, e.g. a resource saved as a link. */
export function formatFileSize(bytes: number | null) {
  if (bytes === null) return "--"
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

const timeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
]

/** "10 minutes ago", "Yesterday", or "Just now" under a minute. */
export function timeAgo(date: string | Date, now = new Date()) {
  const seconds = (new Date(date).getTime() - now.getTime()) / 1000
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  for (const [unit, size] of timeUnits) {
    if (Math.abs(seconds) < size) continue
    const text = format.format(Math.trunc(seconds / size), unit)
    return text.charAt(0).toUpperCase() + text.slice(1)
  }
  return "Just now"
}
