"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/AuthShell"
import {
  OnboardingLoading,
  useOnboarding,
} from "@/components/onboarding/OnboardingProvider"

/**
 * The mentor flow's step between choosing a password and completing the
 * profile. Nothing is saved yet: the password goes to the backend with the
 * profile at the end, as for every role.
 */
export default function AccountCreatedPage() {
  const router = useRouter()
  const { copy, hrefFor, password } = useOnboarding()

  // Other roles go straight to the profile, and a refresh loses the password
  // (it's held in memory only), so send either back to the right step.
  const redirectTo = !copy.showsAccountCreated
    ? "/onboarding/complete-profile"
    : !password
      ? "/onboarding/create-account"
      : null
  useEffect(() => {
    if (redirectTo) router.replace(hrefFor(redirectTo))
  }, [redirectTo, router, hrefFor])

  if (redirectTo) return <OnboardingLoading />

  return (
    <AuthShell>
      <h1 className="text-lg/6 font-semibold text-text-primary">
        Account created!
      </h1>

      <div className="h-[350px] w-full rounded-2xl bg-surface-brand" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-lg/6 font-semibold text-text-secondary">
            Your Rise Classroom account is ready.
          </p>
          <p className="text-lg/6 font-semibold text-text-primary">
            Let&apos;s complete your profile so we can personalize your
            experience.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full cursor-pointer rounded-full"
          nativeButton={false}
          render={<Link href={hrefFor("/onboarding/complete-profile")} />}
        >
          Continue
        </Button>
      </div>
    </AuthShell>
  )
}
