import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Each state's colours come from the design system's Button component.
        primary:
          "bg-interactive-primary-default text-interactive-primary-text hover:bg-interactive-primary-hover focus-visible:border-border-focus focus-visible:bg-interactive-primary-hover active:bg-interactive-primary-pressed disabled:bg-interactive-primary-disabled disabled:text-text-disabled",

        secondary:
          "border-border-default bg-interactive-secondary-default text-text-secondary hover:border-border-strong hover:bg-interactive-secondary-hover focus-visible:border-border-focus focus-visible:bg-interactive-secondary-hover active:border-transparent active:bg-interactive-secondary-pressed disabled:border-transparent disabled:bg-interactive-secondary-disabled disabled:text-text-disabled",

        tertiary:
          "border-border-default bg-interactive-tertiary-default text-text-brand hover:border-border-strong hover:bg-interactive-tertiary-hover focus-visible:border-border-focus focus-visible:bg-interactive-tertiary-pressed active:border-transparent active:bg-interactive-tertiary-pressed disabled:border-transparent disabled:bg-interactive-secondary-disabled disabled:text-text-disabled",

        destructive:
          "bg-interactive-destructive-default text-interactive-destructive-text hover:bg-interactive-destructive-hover focus-visible:border-border-focus focus-visible:bg-interactive-destructive-hover active:bg-interactive-destructive-pressed disabled:bg-interactive-destructive-disabled disabled:text-text-disabled",
      },

      size: {
        medium:
          "h-10 gap-2 px-4 py-2 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-[18px]",
 
        sm: "h-8 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",

        "icon-sm": "size-8 p-2",

        lg: "h-11 gap-3 px-5 py-3 text-base has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-5",

        icon: "size-8",

        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",

        "icon-lg": "size-9",
      },

      pill: {
        true: "rounded-full",
        false: "rounded-lg",
      },

      disabled: {
        true: "pointer-events-none",
        false: "",
      },
    },

    defaultVariants: {
      variant: "primary",
      size: "sm",
      pill: false,
      disabled: false,
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "sm",
  pill = false,
  disabled = false,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-pill={pill}
      data-disabled={disabled}
      disabled={disabled}
      className={cn(
        "cursor-pointer disabled:cursor-not-allowed",
        buttonVariants({
          variant,
          size,
          pill,
          disabled,
          className,
        })
      )}
      {...props}
    />
  )
}

export { Button, buttonVariants }