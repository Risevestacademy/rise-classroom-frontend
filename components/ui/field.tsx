import { Field } from "@base-ui/react/field"

import {
  Input,
  Label,
  Hint,
  Error,
  type InputProps,
} from "./input"
import { Textarea } from "./textarea"

import { cn } from "cn"

function FormField({
  className,
  label,
  labelIcon,
  required,
  hint,
  textarea = false,
  showCount = false,
  maxLength,
  error,
  disabled,
  invalid,
  inputProps,
  ...props
}: Omit<
  React.ComponentProps<typeof Field.Root>,
  "disabled" | "invalid"
> & {
  label: React.ReactNode
  labelIcon?: React.ReactNode
  required?: boolean
  hint?: React.ReactNode
  textarea?: boolean
  showCount?: boolean
  maxLength?: number
  error?: React.ReactNode
  disabled?: boolean
  invalid?: boolean
  inputProps: InputProps
}) {
  return (
    <Field.Root
      className={cn("flex w-full flex-col", className)}
      disabled={disabled}
      invalid={invalid}
      {...props}
    >
      <Label icon={labelIcon} required={required}>
        {label}
      </Label>

      <div className="mt-1.5">
        {textarea? 

        <Textarea maxLength={maxLength} showCount={showCount} />
            :
        <Input {...inputProps} />
        }
      </div>

      {hint && <Hint>{hint}</Hint>}

      {error && (
        <Error match={true}>
          {error}
        </Error>
      )}
    </Field.Root>
  )
}

export { FormField }