import { getCountries, getCountryCallingCode } from "libphonenumber-js"
import * as Flags from "country-flag-icons/react/3x2"

export type CountryCode = ReturnType<typeof getCountries>[number]

export type Country = {
  iso2: CountryCode
  name: string
  dialCode: string
  FlagIcon: (typeof Flags)[CountryCode]
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

export const countries: Country[] = getCountries().map((iso2) => ({
  iso2,
  name: regionNames.of(iso2) ?? iso2,
  dialCode: `+${getCountryCallingCode(iso2)}`,
  FlagIcon: Flags[iso2],
}))

export const defaultCountry: CountryCode = "NG"
