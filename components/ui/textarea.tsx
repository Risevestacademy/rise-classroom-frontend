"use client"

import { useState } from "react"

import { Field } from "@base-ui/react/field"

import { cn } from "cn"

type TextareaProps = Omit<
  React.ComponentProps<typeof Field.Control>,
  "render"
> & {
  maxLength?: number
  showCount?: boolean
}

function TextareaWrapper({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg text-neutral-900 border border-neutral-300 bg-transparent transition-colors",
        "has-[textarea:placeholder-shown]:border-neutral-300 has-[textarea:placeholder-shown]:text-neutral-500",
        "hover:bg-neutral-200",
        "has-[textarea:focus]:border-primary-500",
        "has-[[data-disabled]]:border-neutral-300 has-[[data-disabled]]:bg-transparent has-[[data-disabled]]:text-interactive-destructive-disabled-text/30",
        "has-[[data-invalid]]:border-semantic-border-error has-[[data-invalid]]:bg-transparent has-[[data-invalid]]:text-semantic-text-error",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function Textarea({
  className,
  maxLength,
  showCount = false,
  ...props
}: TextareaProps) {
  const [value, setValue] = useState(
    typeof props.defaultValue === "string" ? props.defaultValue : ""
  )

  const isControlled = props.value !== undefined
  const currentLength = isControlled
    ? String(props.value ?? "").length
    : value.length

  return (
    <TextareaWrapper>
      <Field.Control
        render={<textarea />}
        data-slot="textarea"
        maxLength={maxLength}
        className={cn(
          "min-h-16 w-full resize-y p-3 outline-none",
          "text-base md:text-sm",
          "placeholder:text-neutral-500",
          "disabled:cursor-not-allowed",
          className
        )}
        onChange={(event) => {
          setValue(event.target.value)
          props.onChange?.(event)
        }}
        {...props}
      />

      {showCount && maxLength !== undefined && (
        <span className="self-end px-3 pb-2 text-xs text-neutral-500">
          {currentLength}/{maxLength}
        </span>
      )}
    </TextareaWrapper>
  )
}

export { Textarea, TextareaWrapper }

export type { TextareaProps }