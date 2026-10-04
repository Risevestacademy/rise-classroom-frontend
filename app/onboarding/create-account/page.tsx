"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Field } from "@base-ui/react/field"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Hint } from "@/components/ui/hint"
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle"
import { AuthShell } from "@/components/AuthShell"
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter"
import { useOnboarding } from "@/components/onboarding/OnboardingProvider"
import { SquareLock } from "@/assets/icons"
import { evaluatePassword } from "@/lib/password-strength"

export default function CreateAccountPage() {
  const router = useRouter()
  const { details, isInstructor, hrefFor, password: savedPassword, setPassword: savePassword } =
    useOnboarding()

  // Coming back from the next step keeps what was already typed.
  const [password, setPassword] = useState(savedPassword)
  const [confirmPassword, setConfirmPassword] = useState(savedPassword)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreed, setAgreed] = useState(Boolean(savedPassword))

  const { allRequirementsMet } = useMemo(
    () => evaluatePassword(password),
    [password]
  )
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const canSubmit = allRequirementsMet && passwordsMatch && agreed

  // Nothing is sent yet: the backend sets the password and display name in one
  // call, so the password is carried to the profile step and submitted there.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    savePassword(password)
    router.push(hrefFor("/onboarding/complete-profile"))
  }

  return (
    <AuthShell>
      <div className="mx-auto flex h-[140px] my-10 w-full items-center justify-center">
        <Image className="rounded-2xl" src="/create-account.png" alt="Create your account" width={500} height={0} />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {isInstructor
            ? "Set up your account to get started with Rise Classroom."
            : "Set up your account to start your learning journey with Rise Classroom"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field.Root className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Email Address</label>
          <Input type="email" value={details.email} disabled readOnly />
          <Hint>Pre-filled from the invitation and not editable</Hint>
        </Field.Root>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-neutral-700">
            Password
          </label>
          <Input
            id="password"
            type={showPassword ? "basic" : "password"}
            leadingIcon={<SquareLock />}
            trailingIcon={
              <PasswordVisibilityToggle
                visible={showPassword}
                onToggle={() => setShowPassword((value) => !value)}
              />
            }
            placeholder="Enter your password"
            value={password}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(event.target.value)
            }
          />

          <PasswordStrengthMeter password={password} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password" className="text-sm font-medium text-neutral-700">
            Confirm Password
          </label>
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "basic" : "password"}
            leadingIcon={<SquareLock />}
            trailingIcon={
              <PasswordVisibilityToggle
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((value) => !value)}
              />
            }
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setConfirmPassword(event.target.value)
            }
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-text-error">Passwords don&apos;t match.</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <Checkbox checked={agreed} onCheckedChange={setAgreed} />
          I agree to the Terms of Use and Privacy Policy
        </label>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!canSubmit}
          className="w-full rounded-full cursor-pointer"
        >
          Create Account
        </Button>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-brand-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
