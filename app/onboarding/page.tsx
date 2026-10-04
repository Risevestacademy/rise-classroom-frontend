"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/AuthShell"
import { useOnboarding } from "@/components/onboarding/OnboardingProvider"

export default function OnboardingInvitePage() {
  const { details, isInstructor, hrefFor } = useOnboarding()

  return (
    <AuthShell>
      <h1 className="text-xl font-bold text-neutral-800">
        Hi {details.firstName}, you&apos;ve been invited to Rise Classroom
        {isInstructor ? " as an instructor" : ""}
      </h1>

      <div className="h-[350px] w-full rounded-2xl bg-surface-brand" />

      <div className="flex flex-col gap-6">
        <p className="text-lg font-semibold text-neutral-800">
          Your account is almost ready. Let&apos;s get you set up.
        </p>

        <Button
          variant="primary"
          size="lg"
          className="w-full cursor-pointer rounded-full"
          nativeButton={false}
          render={<Link href={hrefFor("/onboarding/create-account")} />}
        >
          Continue
        </Button>
      </div>
    </AuthShell>
  )
}
