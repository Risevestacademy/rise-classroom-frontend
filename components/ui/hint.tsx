import { Field } from "@base-ui/react/field"

import { InfoIcon } from "@/assets/icons"

import { cn } from "cn"

function Hint({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Field.Description>) {
  return (
    <Field.Description
      className={cn(
        "mt-1.5 flex items-center gap-1 text-xs text-neutral-600",
        className
      )}
      {...props}
    >
      <span className="shrink-0 [&>svg]:size-3.5">
        <InfoIcon />
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
        "mt-1.5 flex items-center gap-1 text-xs text-semantic-text-error",
        className
      )}
      {...props}
    >
      <span className="shrink-0 [&>svg]:size-3.5">
        <InfoIcon />
      </span>

      {children}
    </Field.Error>
  )
}

export { Hint, Error }