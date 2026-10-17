import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check, Minus } from "lucide-react"

import { cn } from "cn"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer group/checkbox flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-neutral-300 bg-neutral-0 outline-none transition-colors",
        "hover:border-brand-primary",
        "focus-visible:ring-3 focus-visible:ring-brand-primary/30",
        "data-[checked]:border-brand-primary data-[checked]:bg-brand-primary",
        "data-[indeterminate]:border-brand-primary data-[indeterminate]:bg-brand-primary",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex text-neutral-0">
        <Check
          className="size-3 group-data-[indeterminate]/checkbox:hidden"
          strokeWidth={3}
        />
        <Minus
          className="hidden size-3 group-data-[indeterminate]/checkbox:block"
          strokeWidth={3}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
