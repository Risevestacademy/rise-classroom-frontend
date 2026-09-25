"use client"

import { useMemo, useState } from "react"

import { Popover } from "@base-ui/react/popover"

import { ChevronDown, Search } from "lucide-react"

import { countries, type CountryCode } from "@/lib/countries"

import { cn } from "cn"

function CountryFlag({
  Icon,
  disabled,
  className,
}: {
  Icon?: (typeof countries)[number]["FlagIcon"]
  disabled?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100",
        disabled && "grayscale opacity-60",
        className
      )}
    >
      {Icon && <Icon preserveAspectRatio="none" className="size-5 shrink-0" />}
    </span>
  )
}

function CountrySelect({
  value,
  onChange,
  disabled,
}: {
  value: CountryCode
  onChange: (country: CountryCode) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)

  const selected = countries.find((c) => c.iso2 === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return countries

    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso2.toLowerCase().includes(q)
    )
  }, [query])

  function handleOpenChange(next: boolean) {
    if (disabled) return

    setOpen(next)

    if (!next) {
      setQuery("")
      setActiveIndex(0)
    } else {
      setActiveIndex(0)
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setActiveIndex(0)
  }

  function select(iso2: CountryCode) {
    onChange(iso2)
    setOpen(false)
    setQuery("")
    setActiveIndex(0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()

      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()

      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()

      const country = filtered[activeIndex]

      if (country) {
        select(country.iso2)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        disabled={disabled}
        aria-label={
          selected ? `Country: ${selected.name}` : "Select country"
        }
        className="flex shrink-0 items-center gap-1 rounded-full outline-none disabled:cursor-not-allowed"
      >
        <CountryFlag Icon={selected?.FlagIcon} disabled={disabled} />

        <ChevronDown className="size-3.5 text-neutral-400" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
        >
          <Popover.Popup className="w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-neutral-200 p-2">
              <Search className="size-4 shrink-0 text-neutral-400" />

              <input
                autoFocus
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search country"
                className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
              />
            </div>

            <ul
              role="listbox"
              className="max-h-64 overflow-y-auto p-1"
            >
              {filtered.length === 0 && (
                <li className="px-2 py-4 text-center text-sm text-neutral-400">
                  No countries found
                </li>
              )}

              {filtered.map((country, index) => (
                <li key={country.iso2}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={country.iso2 === value}
                    onClick={() => select(country.iso2)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                      index === activeIndex
                        ? "bg-neutral-100"
                        : "hover:bg-neutral-50",
                      country.iso2 === value &&
                        "font-medium text-neutral-900"
                    )}
                  >
                    <CountryFlag Icon={country.FlagIcon} />

                    <span className="flex-1 truncate text-neutral-700">
                      {country.name}
                    </span>

                    <span className="shrink-0 text-neutral-400">
                      {country.dialCode}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export { CountrySelect }