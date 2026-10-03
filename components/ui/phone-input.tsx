"use client"

import { useState } from "react"
import { AsYouType } from "libphonenumber-js"
import { InputWrapper } from "./input"
import { CountrySelect } from "./country-select"
import { countries, defaultCountry, type CountryCode } from "@/lib/countries"
import { cn } from "cn"

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "type" | "size"
> & {
  size?: "large" | "medium" | "small"
  invalid?: boolean
  defaultCountry?: CountryCode
  onValueChange?: (value: {
    country: CountryCode
    national: string
    e164: string
  }) => void
}

function PhoneInput({
  className,
  size = "large",
  disabled,
  invalid,
  defaultCountry: defaultCountryProp = defaultCountry,
  onValueChange,
  ...props
}: PhoneInputProps) {
  const [country, setCountry] = useState<CountryCode>(defaultCountryProp)
  const [national, setNational] = useState("")

  const selected = countries.find((c) => c.iso2 === country)

  return (
    <InputWrapper
      size={size}
      data-invalid={invalid || undefined}
      className={className}
    >
      <CountrySelect
        value={country}
        disabled={disabled}
        onChange={(next) => {
          setCountry(next)
          const formatter = new AsYouType(next)
          const formatted = formatter.input(national)
          onValueChange?.({
            country: next,
            national: formatted,
            e164: formatter.getNumber()?.number ?? "",
          })
        }}
      />

      <span className="h-4 w-px shrink-0 bg-neutral-200" aria-hidden="true" />

      <span
        className={cn(
          "shrink-0 text-sm text-neutral-500",
          disabled && "text-neutral-300"
        )}
      >
        {selected?.dialCode}
      </span>

      <input
        type="tel"
        disabled={disabled}
        value={national}
        onChange={(e) => {
          const formatter = new AsYouType(country)
          const formatted = formatter.input(e.target.value)
          setNational(formatted)
          onValueChange?.({
            country,
            national: formatted,
            e164: formatter.getNumber()?.number ?? "",
          })
        }}
        placeholder="000 000 0000"
        className={cn(
          "w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400",
          "disabled:cursor-not-allowed disabled:text-neutral-400"
        )}
        {...props}
      />
    </InputWrapper>
  )
}

export { PhoneInput }
export type { PhoneInputProps }