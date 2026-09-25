import { Search } from "lucide-react"
import { FormField } from "@/components/ui/field"

export default function InputShowcasePage() {
  const emailError = "Please enter a valid email address."
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-neutral-900">
          Input — Design System Reference
        </h1>
        <p className="text-sm text-neutral-500">
          One example per type. Default leading icons apply automatically
          for basic/email/password/date unless overridden.
        </p>
      </header>

      <FormField
        label="Change Label"
        required
        hint="This is a hint text to help users."
        inputProps={{ type: "basic", placeholder: "Placeholder text" }}
      />

      <FormField
        label="Email Address"
        required
        hint="This is a hint text to help users."
        inputProps={{ type: "email", placeholder: "rise@email.com" }}
      />

      <FormField
        label="Password"
        hint="This is a hint text to help users."
        inputProps={{ type: "password", placeholder: "••••••••" }}
      />

      <FormField
        label="Date"
        hint="This is a hint text to help users."
        inputProps={{ type: "date", placeholder: "DD/MM/YYYY" }}
      />

      <FormField
        label="Search"
        required
        hint="This is a hint text to help users."
        inputProps={{
          type: "search",
          leadingIcon: <Search />,
          placeholder: "Search",
        }}
      />

      <FormField
        label="Phone Number"
        required
        hint="This is a hint text to help users."
        inputProps={{ type: "phone-number" }}
      />

      <FormField
        label="Website"
        required
        hint="This is a hint text to help users."
        inputProps={{ type: "website" }}
      />

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-600">States</h2>

        <FormField
          label="Disabled"
          textarea
          showCount
          maxLength={200}
          disabled
          hint="This is a hint text to help users."
          inputProps={{ type: "email", placeholder: "rise@email.com" }}
        />

        <FormField
          label="Email"
          required
          invalid={!!emailError}
          textarea
          hint="We'll never share your email."
          error={emailError}
          inputProps={{
            type: "email",
            placeholder: "you@example.com",
          }}
        />

        <FormField
          label="Small size"
          hint="This is a hint text to help users."
          inputProps={{
            type: "basic",
            size: "small",
            placeholder: "Placeholder text",
          }}
        />

        <FormField
          label="Medium size"
          hint="This is a hint text to help users."
          inputProps={{
            type: "basic",
            size: "medium",
            placeholder: "Placeholder text",
          }}
        />
      </div>
    </main>
  )
}