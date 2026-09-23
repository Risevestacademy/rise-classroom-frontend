import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-500 text-neutral-50 hover:bg-interactive-primary-hover focus-visible:bg-interactive-primary-hover disabled:bg-neutral-400 disabled:text-interactive-primary-disabled/30",

        secondary:
          "bg-neutral-50 text-neutral-600 hover:bg-neutral-400 focus-visible:border-1 focus-visible:border-primary-500 focus-visible:bg-interactive-secondary-focused disabled:bg-interactive-secondary-disabled disabled:text-interactive-secondary-disabled-text/30",

        tertiary:
          "bg-neutral-300 text-primary-500 hover:bg-neutral-400 focus-visible:border-1 focus-visible:border-primary-500 focus-visible:bg-interactive-tertiary-focused disabled:bg-interactive-secondary-disabled disabled:text-interactive-secondary-disabled-text/30",

        destructive:
          "bg-interactive-destructive-default text-neutral-50 hover:bg-interactive-destructive-hover focus-visible:border-1 focus-visible:border-primary-500 focus-visible:bg-interactive-destructive-hover disabled:bg-interactive-destructive-disabled disabled:text-interactive-destructive-disabled-text/30",
      },

      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",

        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",

        sm: "h-8 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",

        "icon-sm": "size-8 p-2",

        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",

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
      size: "default",
      pill: false,
      disabled: false,
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
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