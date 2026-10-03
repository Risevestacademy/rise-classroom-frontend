"use client"

import { InputWrapper } from "./input"
import { cn } from "cn"

type WebsiteInputProps = Omit<React.ComponentProps<"input">, "type" | "size"> & {
  size?: "large" | "medium" | "small"
  invalid?: boolean
  // Static, not editable — matches your screenshot. If you need http://
  // as an option too, that's a small variant/dropdown, not a prop tweak;
  // flag it if you want that built out.
  protocol?: string
}

function WebsiteInput({
  className,
  size = "large",
  disabled,
  invalid,
  protocol = "https://",
  placeholder = "www.classroom.com",
  ...props
}: WebsiteInputProps) {
  return (
    <InputWrapper
      size={size}
      data-invalid={invalid || undefined}
      className={className}
    >
      <span className="shrink-0 text-sm text-neutral-500">{protocol}</span>
      <span className="h-4 w-px shrink-0 bg-neutral-200" aria-hidden="true" />
      <input
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400",
          "disabled:cursor-not-allowed disabled:text-neutral-400"
        )}
        {...props}
      />
    </InputWrapper>
  )
}

export { WebsiteInput }
export type { WebsiteInputProps }