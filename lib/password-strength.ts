type PasswordRequirement = {
  key: string
  label: string
  test: (value: string) => boolean
}

const passwordRequirement: PasswordRequirement[] = [
  {
    key: "uppercase",
    label: "At least 1 uppercase",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    key: "number",
    label: "At least 1 number",
    test: (value) => /[0-9]/.test(value),
  },
  {
    key: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
]


const strengthSegments = 6

type PasswordStrength = "weak" | "moderate" | "strong"

const passwordStrengthMeta: Record<
  PasswordStrength,
  { filledSegments: number; barColor: string; label: string }
> = {
  weak: {
    filledSegments: 2,
    barColor: "bg-text-error",
    label: "Weak password. Must contain at least;",
  },
  moderate: {
    filledSegments: 4,
    barColor: "bg-icon-warning",
    label: "Moderate password. Must contain at least;",
  },
  strong: {
    filledSegments: 6,
    barColor: "bg-icon-success",
    label: "Strong password. Your password is secure.",
  },
}

function evaluatePassword(password: string) {
  const metCount = passwordRequirement.filter((requirement) => requirement.test(password)).length
  const allRequirementsMet = metCount === passwordRequirement.length

  const strength: PasswordStrength | null =
    password.length === 0 ? null : metCount >= 3 ? "strong" : metCount === 2 ? "moderate" : "weak"

  const filledSegments = strength ? passwordStrengthMeta[strength].filledSegments : 0

  return { metCount, allRequirementsMet, strength, filledSegments }
}

export {
  passwordRequirement,
  passwordStrengthMeta,
  strengthSegments,
  evaluatePassword,
}
export type { PasswordRequirement, PasswordStrength }
