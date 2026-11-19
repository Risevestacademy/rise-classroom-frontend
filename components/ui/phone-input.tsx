"use client"

import { useState } from "react"
import {
  AsYouType,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from "libphonenumber-js"
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
  /* A saved number in international form, e.g. "+2348031234567". */
  defaultNumber?: string | null
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
  defaultNumber,
  onValueChange,
  ...props
}: PhoneInputProps) {
  const [initial] = useState(() =>
    defaultNumber ? parsePhoneNumberFromString(defaultNumber) : undefined
  )
  const [country, setCountry] = useState<CountryCode>(
    initial?.country ?? defaultCountryProp
  )
  const [national, setNational] = useState(() =>
    initial ? new AsYouType(initial.country).input(initial.nationalNumber) : ""
  )

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
          setNational(formatted)
          onValueChange?.({
            country: next,
            national: formatted,
            e164: formatter.getNumber()?.number ?? "",
          })
        }}
      />

      <span className="h-4 w-px shrink-0 bg-neutral-100" aria-hidden="true" />

      <span
        className={cn(
          "shrink-0 text-sm text-neutral-400",
          disabled && "text-neutral-200"
        )}
      >
        {selected?.dialCode}
      </span>

      <input
        {...props}
        type="tel"
        inputMode="tel"
        disabled={disabled}
        value={props.value ?? national}
        onChange={(e) => {
          // Past the country's longest number the formatter gives up and
          // shows raw digits, so stop accepting digits there.
          const digits = e.target.value.replace(/\D/g, "")
          if (validatePhoneNumberLength(digits, country) === "TOO_LONG") return
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
          "w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-300",
          "disabled:cursor-not-allowed disabled:text-neutral-300"
        )}
      />
    </InputWrapper>
  )
}

export { PhoneInput }
export type { PhoneInputProps }