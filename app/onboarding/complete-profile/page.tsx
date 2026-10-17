"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertCircle } from "lucide-react"

import { User } from "@/assets/icons"
import { FormField } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/AuthShell"
import {
  OnboardingLoading,
  useOnboarding,
} from "@/components/onboarding/OnboardingProvider"
import { landingPathFor, signIn } from "@/lib/auth"
import {
  completeOnboarding,
  getOnboardingErrorMessage,
  PROFILE_IMAGE_TYPES,
  validateProfileImage,
  type OnboardingDetails,
} from "@/lib/onboarding"

type StepId = 1 | 2 | 3

const DISPLAY_NAME_MAX = 100

function stepContent(step: StepId, isInstructor: boolean) {
  switch (step) {
    case 1:
      return {
        title: "Complete your profile",
        subtitle: "Tell us a little about yourself",
      }
    case 2:
      return {
        title: "Confirm your Program",
        subtitle: isInstructor
          ? "Review your program and teaching assignment before continuing."
          : "Make sure these details are correct before you continue",
      }
    case 3:
      return {
        title: "Welcome to Rise Classroom",
        subtitle: isInstructor
          ? "Your teaching space is ready. Let’s get you set up to support your learners."
          : "",
      }
  }
}

/** A picked photo plus the blob URL used to preview it. */
type ProfilePhoto = { file: File; previewUrl: string }

function ProfilePhotoPicker({
  photo,
  error,
  onPhotoChange,
  onPhotoError,
}: {
  photo: ProfilePhoto | null
  error: string | null
  onPhotoChange: (file: File | null) => void
  onPhotoError: (message: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Clear the input so picking the same file again still fires onChange.
    event.target.value = ""
    if (!file) return

    const problem = validateProfileImage(file)
    if (problem) onPhotoError(problem)
    else onPhotoChange(file)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
          {photo ? (
            // A local blob preview, so next/image's optimisation doesn't apply.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.previewUrl}
              alt="Your profile photo"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="size-6 text-neutral-400" />
          )}
        </span>
        <div className="space-y-1.5">
          <p className="text-base text-neutral-800">
            Profile photo{" "}
            <span className="text-sm text-neutral-500">(optional)</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="cursor-pointer border border-neutral-300"
              onClick={() => fileInputRef.current?.click()}
            >
              {photo ? "Change photo" : "Add photo"}
            </Button>
            {photo && (
              <button
                type="button"
                onClick={() => onPhotoChange(null)}
                className="text-sm font-medium text-text-error hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={PROFILE_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
      <p
        role={error ? "alert" : undefined}
        className={
          error ? "text-xs text-text-error" : "text-xs text-neutral-500"
        }
      >
        {error ?? "JPEG, PNG or WebP, up to 2MB"}
      </p>
    </div>
  )
}

function ProfileStep({
  fullName,
  displayName,
  onDisplayNameChange,
  photo,
  photoError,
  onPhotoChange,
  onPhotoError,
}: {
  fullName: string
  displayName: string
  onDisplayNameChange: (value: string) => void
  photo: ProfilePhoto | null
  photoError: string | null
  onPhotoChange: (file: File | null) => void
  onPhotoError: (message: string) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <ProfilePhotoPicker
        photo={photo}
        error={photoError}
        onPhotoChange={onPhotoChange}
        onPhotoError={onPhotoError}
      />
      <FormField
        label="Full Name"
        hint="Set by your program admin and not editable"
        disabled
        inputProps={{
          type: "basic",
          value: fullName,
          readOnly: true,
          leadingIcon: <User />,
        }}
      />
      <FormField
        label="Display name"
        required
        hint="This is how other people in Rise Classroom will see you"
        inputProps={{
          type: "basic",
          name: "displayName",
          value: displayName,
          maxLength: DISPLAY_NAME_MAX,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
            onDisplayNameChange(event.target.value),
          leadingIcon: <User />,
          placeholder: "How should we call you?",
        }}
      />
    </div>
  )
}

function ConfirmProgramStep({
  memberships,
}: {
  memberships: OnboardingDetails["memberships"]
}) {
  return (
    <div className="space-y-5 rounded-xl bg-surface-brand p-5">
      {memberships.length === 0 ? (
        <p className="text-sm text-neutral-500">
          You haven&apos;t been assigned to a cohort or track yet. Your program
          admin can add you once your account is set up.
        </p>
      ) : (
        memberships.map((membership) => (
          <div
            key={`${membership.cohort}-${membership.track}`}
            className="space-y-5"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-neutral-800">Cohort</p>
              <p className="text-sm text-neutral-500">{membership.cohort}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-neutral-800">Track</p>
              <p className="text-sm text-neutral-500">{membership.track}</p>
            </div>
          </div>
        ))
      )}
      <h2 className="pt-2 text-lg font-bold text-neutral-800">Is everything correct?</h2>
    </div>
  )
}

function WelcomeStep() {
  return (
    <>
      <div className="aspect-square w-full rounded-2xl bg-surface-brand" />
      <p className="text-base font-medium text-neutral-800">
        Learn, track progress, complete assignments, and stay connected.
      </p>
    </>
  )
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { token, details, isInstructor, hrefFor, password, setPassword } =
    useOnboarding()

  const [step, setStep] = useState<StepId>(1)
  const [displayName, setDisplayName] = useState(
    `${details.firstName} ${details.lastName.charAt(0)}.`.trim()
  )
  const [photo, setPhoto] = useState<ProfilePhoto | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Blob URLs keep the file in memory until revoked, so release the old one
  // whenever the photo is replaced or removed, and the last one on unmount.
  const photoUrlRef = useRef<string | null>(null)
  useEffect(
    () => () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    },
    []
  )

  function handlePhotoChange(file: File | null) {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    const previewUrl = file ? URL.createObjectURL(file) : null
    photoUrlRef.current = previewUrl
    setPhoto(file && previewUrl ? { file, previewUrl } : null)
    setPhotoError(null)
  }

  // The password lives in memory only, so a refresh on this page loses it —
  // send the invitee back a step to enter it again.
  const needsPassword = !password && step !== 3
  useEffect(() => {
    if (needsPassword) router.replace(hrefFor("/onboarding/create-account"))
  }, [needsPassword, router, hrefFor])

  // Uses up the invite link, then signs straight in with the new password.
  // Sign-in failing afterwards isn't fatal: the account exists, so the welcome
  // step just sends them to the sign-in page instead.
  const finish = useMutation({
    mutationFn: async () => {
      await completeOnboarding({
        token,
        displayName: displayName.trim(),
        password,
        confirmPassword: password,
        image: photo?.file,
      })

      try {
        const { user } = await signIn({ email: details.email, password })
        return landingPathFor(user)
      } catch {
        return "/sign-in"
      }
    },
    onSuccess: () => {
      setPassword("")
      queryClient.removeQueries({ queryKey: ["auth", "session"] })
      setStep(3)
    },
  })

  if (needsPassword) return <OnboardingLoading />

  const { title, subtitle } = stepContent(step, isInstructor)
  const canContinue =
    !finish.isPending && (step !== 1 || displayName.trim().length > 0)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canContinue) return

    if (step === 1) setStep(2)
    else if (step === 2) finish.mutate()
    else router.push(finish.data ?? "/sign-in")
  }

  const ctaLabel =
    step === 1
      ? "Continue"
      : step === 2
        ? finish.isPending
          ? "Setting up your account…"
          : "Yes, continue"
        : finish.data === "/sign-in"
          ? "Go to sign in"
          : "Go to your dashboard"

  return (
    <AuthShell>
      <div className="mx-auto flex w-full items-center justify-center">
        <Image
          src="/onboarding.png"
          height={113}
          width={358}
          alt="Illustration"
          className="h-[113px] w-full rounded-2xl object-cover"
        />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-800">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {step === 1 && (
          <ProfileStep
            fullName={`${details.firstName} ${details.lastName}`}
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            photo={photo}
            photoError={photoError}
            onPhotoChange={handlePhotoChange}
            onPhotoError={setPhotoError}
          />
        )}
        {step === 2 && <ConfirmProgramStep memberships={details.memberships} />}
        {step === 3 && <WelcomeStep />}

        {finish.isError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-border-error bg-surface-error-badge px-4 py-3 text-sm text-text-error"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{getOnboardingErrorMessage(finish.error)}</span>
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          pill
          disabled={!canContinue}
          className="w-full justify-center rounded-full cursor-pointer"
        >
          {ctaLabel}
        </Button>

        {step === 2 && (
          <div className="flex flex-col items-center gap-2 text-center text-sm text-neutral-500">
            <button
              type="button"
              disabled={finish.isPending}
              onClick={() => setStep(1)}
              className="font-medium text-brand-primary hover:underline disabled:opacity-50"
            >
              Back
            </button>
            <p>
              Something&apos;s wrong?{" "}
              <a href="#" className="font-medium text-brand-primary hover:underline">
                Contact support
              </a>
            </p>
          </div>
        )}
      </form>
    </AuthShell>
  )
}
