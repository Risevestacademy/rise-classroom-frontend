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
        "flex items-center gap-1 text-[14px] font-medium text-neutral-800 data-[disabled]:text-neutral-400",
        className
      )}
      {...props}
    >
      {children}

      {required ? (
        <span className="text-error-600">*</span>
      ) : (
        <>
          <span className="font-medium text-[12px] text-neutral-400">(Optional)</span>

          <span className="shrink-0 text-neutral-400 [&>svg]:size-3.5">
            {icon ?? <InfoIcon />}
          </span>
        </>
      )}
    </Field.Label>
  )
}

export { Label }