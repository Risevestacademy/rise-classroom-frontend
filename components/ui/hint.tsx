import { Field } from "@base-ui/react/field"

import { AlertCircle } from "@/assets/icons"

import { cn } from "cn"

function Hint({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Field.Description>) {
  return (
    <Field.Description
      className={cn(
        "mt-1 flex items-center gap-1 font-work text-[13px]/[18px] text-text-secondary data-[disabled]:text-text-disabled",
        className
      )}
      {...props}
    >
      <span className="shrink-0">
        <AlertCircle variant="solid" size={14} />
      </span>

      {children}
    </Field.Description>
  )
}

function Error({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Field.Error>) {
  return (
    <Field.Error
      className={cn(
        "mt-1 flex items-center gap-1 font-work text-[13px]/[18px] text-text-error",
        className
      )}
      {...props}
    >
      <span className="shrink-0">
        <AlertCircle variant="solid" size={14} />
      </span>

      {children}
    </Field.Error>
  )
}

export { Hint, Error }