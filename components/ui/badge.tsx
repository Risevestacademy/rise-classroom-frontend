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
          "bg-neutral-100 border-neutral-300 text-neutral-700 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200",
      },
      {
        variant: "stroked",
        status: "neutral",
        class:
          "bg-transparent border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-200",
      },
      {
        variant: "light",
        status: "neutral",
        class:
          "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
      },
      {
        variant: "full",
        status: "success",
        class: "bg-semantic-surface-success-badge border-semantic-border-success text-semantic-text-success",
      },
      {
        variant: "stroked",
        status: "success",
        class: "bg-transparent border-semantic-border-success text-semantic-text-success",
      },
      {
        variant: "light",
        status: "success",
        class: "bg-semantic-surface-success-badge text-semantic-text-success",
      },
      {
        variant: "full",
        status: "warning",
        class: "bg-semantic-surface-warning-badge border-semantic-border-warning text-semantic-text-warning",
      },
      {
        variant: "stroked",
        status: "warning",
        class: "bg-transparent border-semantic-border-warning text-semantic-text-warning",
      },
      {
        variant: "light",
        status: "warning",
        class: "bg-semantic-surface-warning-badge text-semantic-text-warning",
      },
      {
        variant: "full",
        status: "error",
        class: "bg-semantic-surface-error-badge border-semantic-border-error text-semantic-text-error",
      },
      {
        variant: "stroked",
        status: "error",
        class: "bg-transparent border-semantic-border-error text-semantic-text-error",
      },
      {
        variant: "light",
        status: "error",
        class: "bg-semantic-surface-error-badge text-semantic-text-error",
      },
      {
        variant: "full",
        status: "info",
        class: "bg-semantic-surface-info-badge border-semantic-border-info text-semantic-text-info",
      },
      {
        variant: "stroked",
        status: "info",
        class: "bg-transparent border-semantic-border-info text-semantic-text-info",
      },
      {
        variant: "light",
        status: "info",
        class: "bg-semantic-surface-info-badge text-semantic-text-info",
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