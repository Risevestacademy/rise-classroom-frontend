import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden rounded-full border border-transparent font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        full: "",
        stroked: "",
        light: "",
      },
      status: {
        success: "",
        warning: "",
        error: "",
        info: "",
        neutral: "",
      },

      size: {
        sm: "h-6 gap-1 p-[6px] text-xs [&>svg]:size-3!",
        lg: "h-7 gap-1 p-2 text-sm [&>svg]:size-3.5!", 
      },
    },
    compoundVariants: [
      {
        variant: "full",
        status: "neutral",
        class:
          "bg-neutral-50 border-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-100",
      },
      {
        variant: "stroked",
        status: "neutral",
        class:
          "bg-transparent border-neutral-200 text-neutral-600 dark:border-neutral-500 dark:text-neutral-100",
      },
      {
        variant: "light",
        status: "neutral",
        class:
          "bg-neutral-50 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-100",
      },
      {
        variant: "full",
        status: "success",
        class: "bg-surface-success-badge border-border-success text-text-success",
      },
      {
        variant: "stroked",
        status: "success",
        class: "bg-transparent border-border-success text-text-success",
      },
      {
        variant: "light",
        status: "success",
        class: "bg-surface-success-badge text-text-success",
      },
      {
        variant: "full",
        status: "warning",
        class: "bg-surface-warning-badge border-border-warning text-text-warning",
      },
      {
        variant: "stroked",
        status: "warning",
        class: "bg-transparent border-border-warning text-text-warning",
      },
      {
        variant: "light",
        status: "warning",
        class: "bg-surface-warning-badge text-text-warning",
      },
      {
        variant: "full",
        status: "error",
        class: "bg-surface-error-badge border-border-error text-text-error",
      },
      {
        variant: "stroked",
        status: "error",
        class: "bg-transparent border-border-error text-text-error",
      },
      {
        variant: "light",
        status: "error",
        class: "bg-surface-error-badge text-text-error",
      },
      {
        variant: "full",
        status: "info",
        class: "bg-surface-info-badge border-border-info text-text-info",
      },
      {
        variant: "stroked",
        status: "info",
        class: "bg-transparent border-border-info text-text-info",
      },
      {
        variant: "light",
        status: "info",
        class: "bg-surface-info-badge text-text-info",
      },
    ],
    defaultVariants: {
      variant: "full",
      status: "neutral",
      size: "sm",
    },
  }
)

function Badge({
  className,
  variant = "full",
  status = "neutral",
  size = "sm",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, status, size }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
      status,
      size,
    },
  })
}

export { Badge, badgeVariants }