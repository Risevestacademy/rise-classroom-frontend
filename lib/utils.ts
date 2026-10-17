export { cn } from "cn"

/** `null` means the size isn't known, e.g. a resource saved as a link. */
export function formatFileSize(bytes: number | null) {
  if (bytes === null) return "--"
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`
}
