"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Field } from "@base-ui/react/field"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Hint } from "@/components/ui/hint"
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle"
import { SquareLock } from "@/assets/icons"
import { Logo } from "@/assets/logo"
import {
  passwordRequirement,
  passwordStrengthMeta,
  strengthSegments,
  evaluatePassword,
} from "@/lib/password-strength"

export default function CreateAccountPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const { allRequirementsMet, strength, filledSegments } = useMemo(
    () => evaluatePassword(password),
    [password]
  )
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const canSubmit = allRequirementsMet && passwordsMatch && agreed

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSubmit) {
      router.push("/student/create-account/success")
    }
  }

  return (
    <main className="min-h-[100vh] bg-neutral-100 lg:flex lg:items-center lg:justify-center lg:p-4">
      <div className="mx-auto w-full md:w-[100vw] lg:grid lg:grid-cols-2 lg:overflow-hidden ">
        <div className="relative hidden flex-col justify-between rounded-lg bg-primary-500 p-10 lg:flex">
          <div className="flex flex-1 items-center justify-center">
            <Logo variant="white" size="lg" />
          </div>
          <p className="text-4xl [word-spacing:0.8rem] leading-tight font-bold text-neutral-50">
            Learn. Practice. Progress.
          </p>
        </div>

        <div className="flex flex-col min-h-[100vh]">
          <div className="flex items-center px-6 pt-6 lg:hidden">
            <Logo variant="teal" size="sm" />
          </div>

          <div className="flex flex-col gap-6 px-6 py-10 sm:px-12 lg:px-24">
            <div className="mx-auto flex h-[140px] my-10 w-full  items-center justify-center">
              <Image className="rounded-2xl" src="/create-account.png" alt="Create your account" width={500} height={0} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Create your account</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Set up your account to start your learning journey with Rise Classroom
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 ">
              <Field.Root className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-800">Email Address</label>
                <Input type="email" value="rise@email.com" disabled readOnly />
                <Hint>Pre-filled from the invitation and not editable</Hint>
              </Field.Root>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-neutral-800">
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

                <div className="mt-1 flex gap-1">
                  {Array.from({ length: strengthSegments }).map((_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        index < filledSegments
                          ? strength && passwordStrengthMeta[strength].barColor
                          : "bg-neutral-300"
                      )}
                    />
                  ))}
                </div>

                <p className="mt-1.5 text-xs text-neutral-600">
                  {strength ? passwordStrengthMeta[strength].label : "Must contain at least;"}
                </p>
                <ul className="flex flex-col gap-1">
                  {passwordRequirement.map((requirement) => {
                    const met = requirement.test(password)
                    return (
                      <li key={requirement.key} className="flex items-center gap-1.5 text-xs">
                        <span
                          className={cn(
                            "flex size-3.5 shrink-0 items-center justify-center rounded-full text-neutral-50",
                            met ? "bg-semantic-text-success" : "bg-neutral-300"
                          )}
                        >
                          {met ? (
                            <Check className="size-2.5" strokeWidth={3} />
                          ) : (
                            <X className="size-2.5" strokeWidth={3} />
                          )}
                        </span>
                        <span className={met ? "text-neutral-700" : "text-neutral-500"}>
                          {requirement.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm-password" className="text-sm font-medium text-neutral-800">
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
              </div>

              <label className="flex items-center gap-2 text-sm text-neutral-700">
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

              <p className="text-center text-sm text-neutral-600">
                Already have an account?{" "}
                <Link href="/sign-in" className="font-medium text-primary-500 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
