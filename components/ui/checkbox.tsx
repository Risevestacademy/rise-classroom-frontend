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
        "peer group/checkbox flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-neutral-400 bg-neutral-50 outline-none transition-colors",
        "hover:border-primary-500",
        "focus-visible:ring-3 focus-visible:ring-primary-500/30",
        "data-[checked]:border-primary-500 data-[checked]:bg-primary-500",
        "data-[indeterminate]:border-primary-500 data-[indeterminate]:bg-primary-500",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex text-neutral-50">
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
