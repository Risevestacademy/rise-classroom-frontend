import { Eye, EyeOff } from "lucide-react"

function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex size-4 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-700"
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  )
}

export { PasswordVisibilityToggle }