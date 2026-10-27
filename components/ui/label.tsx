import { Field } from "@base-ui/react/field"

import { InfoIcon } from "@/assets/icons"

import { cn } from "cn"

function Label({
  className,
  icon,
  required = false,
  children,
  ...props
}: React.ComponentProps<typeof Field.Label> & {
  icon?: React.ReactNode
  required?: boolean
}) {
  return (
    <Field.Label
      className={cn(
        "flex items-center gap-1 text-sm font-medium text-text-primary",
        className
      )}
      {...props}
    >
      {children}

      {required ? (
        <span className="text-text-error">*</span>
      ) : (
        <>
          <span className="text-xs font-medium text-text-muted">(Optional)</span>

          <span className="shrink-0 text-neutral-300 [&>svg]:size-3.5">
            {icon ?? <InfoIcon />}
          </span>
        </>
      )}
    </Field.Label>
  )
}

export { Label }