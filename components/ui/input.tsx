import { Field } from "@base-ui/react/field"
import { cn } from "cn"
import { User, Calendar, Mail2, SquareLock } from "@/assets/icons"
import { PhoneInput, type PhoneInputProps } from "./phone-input"
import { WebsiteInput, type WebsiteInputProps } from "./website-input"

const sizeVariant = {
  large: "h-[52px] gap-2 p-[14px]",
  medium: "h-11 gap-2 p-3",
  small: "h-9 gap-1 p-[10px]",
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
        "flex items-center rounded-lg text-neutral-900 border border-neutral-300 bg-transparent transition-colors",
        "has-[input:placeholder-shown]:border-neutral-300 has-[input:placeholder-shown]:text-neutral-500",
        "hover:bg-neutral-200",
        "has-[input:focus]:border-primary-500",
        "has-[[data-disabled]]:border-neutral-300 has-[[data-disabled]]:bg-transparent has-[[data-disabled]]:text-interactive-destructive-disabled-text/30",
        "has-[[data-invalid]]:border-semantic-border-error has-[[data-invalid]]:bg-transparent has-[[data-invalid]]:text-semantic-text-error",
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
        <span className="shrink-0 [&>svg]:size-4 w-5 h-5 flex items-center justify-center">
          {leadingIcon}
        </span>
      )}
      <Field.Control
        type={nativeInputType[type]}
        className={cn(
          "w-full  outline-none ",
          "disabled:cursor-not-allowed",
          className
        )}
        {...inputProps}
      />
      {trailingIcon && (
        <span className="shrink-0 [&>svg]:size-4">
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