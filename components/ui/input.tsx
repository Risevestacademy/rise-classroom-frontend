import { Field } from "@base-ui/react/field"
import { cn } from "cn"
import { User, Calendar, Mail2, SquareLock } from "@/assets/icons"
import { PhoneInput, type PhoneInputProps } from "./phone-input"
import { WebsiteInput, type WebsiteInputProps } from "./website-input"

// Text and icon sizes per size, from the design system's Text Input.
const sizeVariant = {
  large: "h-[52px] gap-2 p-[14px] text-base [&_svg]:size-5",
  medium: "h-11 gap-2 p-3 text-sm [&_svg]:size-[18px]",
  small: "h-9 gap-1 p-[10px] text-sm [&_svg]:size-4",
} as const

type InputSize = keyof typeof sizeVariant

const nativeInputType = {
  basic: "text",
  date: "text",
  email: "email",
  search: "search",
  password: "password",
} satisfies Record<string, React.HTMLInputTypeAttribute>

type NativeInputType = keyof typeof nativeInputType

// Default leading icon per type — only used when the caller doesn't pass
// their own `leadingIcon`. `search` has no default here since none was
// specified; pass one explicitly if you want it.
const defaultLeadingIcon: Partial<Record<NativeInputType, React.ReactNode>> = {
  basic: <User />,
  email: <Mail2 />,
  password: <SquareLock />,
  date: <Calendar />,
}

type BasicInputProps = Omit<
  React.ComponentProps<typeof Field.Control>,
  "type" | "size"
> & {
  type?: NativeInputType
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  size?: InputSize
}

type PhoneNumberInputProps = { type: "phone-number" } & Omit<
  PhoneInputProps,
  "size"
> & { size?: InputSize }

type WebsiteFieldInputProps = { type: "website" } & Omit<
  WebsiteInputProps,
  "size"
> & { size?: InputSize }

type InputProps =
  | BasicInputProps
  | PhoneNumberInputProps
  | WebsiteFieldInputProps

function InputWrapper({
  className,
  size = "large",
  children,
  ...props
}: React.ComponentProps<"div"> & { size?: InputSize }) {
  return (
    <div
      className={cn(
        sizeVariant[size],
        "flex items-center rounded-lg border border-border-default bg-transparent font-work text-text-primary transition-colors",
        "has-[input:placeholder-shown]:text-icon-muted",
        "hover:bg-surface-subtle",
        "has-[input:focus]:border-border-focus has-[input:focus]:bg-surface-subtle",
        "has-[[data-disabled]]:border-border-default has-[[data-disabled]]:bg-transparent has-[[data-disabled]]:text-text-disabled",
        "has-[[data-invalid]]:border-border-error has-[[data-invalid]]:bg-transparent has-[[data-invalid]]:text-text-error",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function Input(props: InputProps) {
  if (props.type === "phone-number") {
    const { size, className, ...phoneProps } = props
    return <PhoneInput size={size} className={className} {...phoneProps} />
  }

  if (props.type === "website") {
    const { size, className, ...websiteProps } = props
    return (
      <WebsiteInput size={size} className={className} {...websiteProps} />
    )
  }

  const {
    type = "basic",
    size,
    className,
    leadingIcon = defaultLeadingIcon[type],
    trailingIcon,
    ...inputProps
  } = props

  return (
    <InputWrapper size={size}>
      {leadingIcon && (
        <span className="flex shrink-0 items-center justify-center">
          {leadingIcon}
        </span>
      )}
      <Field.Control
        type={nativeInputType[type]}
        className={cn(
          "w-full outline-none placeholder:text-text-muted",
          "disabled:cursor-not-allowed disabled:placeholder:text-text-disabled",
          "data-[invalid]:placeholder:text-text-error",
          className
        )}
        {...inputProps}
      />
      {trailingIcon && (
        <span className="flex shrink-0 items-center">
          {trailingIcon}
        </span>
      )}
    </InputWrapper>
  )
}

export { Input, InputWrapper }
export type { InputProps, InputSize }

export { Label } from "./label"
export { Hint, Error } from "./hint"