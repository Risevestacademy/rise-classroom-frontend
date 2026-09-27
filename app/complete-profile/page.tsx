"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { User } from "@/assets/icons"
import { FormField } from "@/components/ui/field"
import { Button } from "@/components/ui/button"

type StepId = 1 | 2 | 3
const TOTAL_STEPS: StepId = 3

const STEP_CONTENT: Record<
  StepId,
  { title: string; subtitle: string; ctaLabel: string }
> = {
  1: {
    title: "Complete your profile",
    subtitle: "Tell us a little about yourself",
    ctaLabel: "Continue",
  },
  2: {
    title: "Confirm your Program",
    subtitle: "Make sure these details are correct before you continue",
    ctaLabel: "Yes, continue",
  },
  3: {
    title: "Welcome to Rise Classroom",
    subtitle: "",
    ctaLabel: "Take a quick tour",
  },
}

const mockProgramData = {
  programName: "Rise Academy",
  cohort: "2026",
  track: "Product Design",
}

function ProfileStep({
  formData,
  onInputChange,
  photoPreview,
  onPhotoChange,
  fileInputRef,
}: {
  formData: { fullName: string; displayName: string }
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  photoPreview: string | null
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <>
      <div className="flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="size-6 text-neutral-400" />
          )}
        </span>
        <div className="space-y-1.5">
          <p className="text-[16px] font-regular text-neutral-900">Profile photo</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Add photo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPhotoChange}
          />
        </div>
      </div>

      <div className="space-y-5">
        <FormField
          label="Full Name"
          required
          inputProps={{
            type: "basic",
            name: "fullName",
            value: formData.fullName,
            onChange: onInputChange,
            leadingIcon: <User />,
            placeholder: "Enter your full name",
          }}
        />
        <FormField
          label="Display name"
          required
          inputProps={{
            type: "basic",
            name: "displayName",
            value: formData.displayName,
            onChange: onInputChange,
            leadingIcon: <User />,
            placeholder: "How should we call you?",
          }}
        />
      </div>
    </>
  )
}

function ConfirmProgramStep() {
  return (
    <div className="space-y-5 rounded-xl bg-primary-50 p-5">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-neutral-900">Program</p>
        <p className="text-sm text-neutral-600">{mockProgramData.programName}</p>
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-neutral-900">Cohort</p>
        <p className="text-sm text-neutral-600">{mockProgramData.cohort}</p>
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-neutral-900">Track</p>
        <p className="text-sm text-neutral-600">{mockProgramData.track}</p>
      </div>
      <h2 className="pt-2 text-lg font-bold text-neutral-900">Is everything correct?</h2>
    </div>
  )
}

function WelcomeStep() {
  return (
    <>
      <div className="aspect-square w-full rounded-2xl bg-primary-50" />
      <p className="text-base font-medium text-neutral-900">
        Learn, track progress, complete assignments, and stay connected.
      </p>
    </>
  )
}

export default function CompleteProfilePage() {
  const [step, setStep] = useState<StepId>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ fullName: "", displayName: "" })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canContinue =
    !isSubmitting &&
    (step !== 1 ||
      (formData.fullName.trim().length > 0 &&
        formData.displayName.trim().length > 0))

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canContinue) return

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)

    if (step < TOTAL_STEPS) {
      setStep((s) => (s + 1) as StepId)
    } else {
      // TODO: final action once step 3 completes.
    }
  }

  const { title, subtitle, ctaLabel } = STEP_CONTENT[step]

  return (
    <main className="flex min-h-screen bg-neutral-100">
      <aside className="hidden md:flex md:w-1/2 flex-col justify-between bg-primary-700 p-12 text-white">
        <div />
        <div className="flex items-center justify-center gap-2 text-lg font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.svg" alt="rice logo" className="w-full max-w-[120px] object-contain" />
        </div>
        <p className="flex w-4/5 justify-center text-2xl font-bold">
          Learn. Practice. Progress.
        </p>
      </aside>

      {/* justify-start (not justify-center) is the actual fix: `main` is
          min-h-screen + flex, so this column stretches to full viewport
          height by default. justify-center was centering the whole form
          block as one clump in the middle, leaving equal dead space above
          and below — that's the "compressed" look. justify-start lets
          content sit at the top like Figma's mobile frame, and the button
          gets pushed to the bottom separately (see mt-auto below) instead
          of just trailing 32px after the fields. */}
      <div className="flex w-full flex-col items-center justify-start px-6 py-12 md:justify-center md:w-1/2">
        <div className="flex w-full max-w-sm flex-1 flex-col md:flex-none">
          <div className="mb-8 flex justify-start md:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-full-green.svg"
              alt="rice logo"
              className="block w-[120px]"
            />
          </div>

          {/* flex-1 here is what makes mt-auto on the button actually mean
              something on mobile — without it there's no leftover space
              for "auto" to consume, and the margin just collapses to 0. */}
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-1 flex-col md:flex-none"
          >
            <div className="space-y-8">
              <Image
                src="/onboarding.png"
                height={113}
                width={358}
                alt="Illustration"
                className="h-[113px] w-full rounded-2xl object-cover"
              />

              <div className="space-y-1">
                <h1 className="text-[24px] font-semibold text-neutral-900">{title}</h1>
                {subtitle && (
                  <p className="text-[14px] font-regular text-neutral-600">{subtitle}</p>
                )}
              </div>

              {step === 1 && (
                <ProfileStep
                  formData={formData}
                  onInputChange={handleInputChange}
                  photoPreview={photoPreview}
                  onPhotoChange={handlePhotoChange}
                  fileInputRef={fileInputRef}
                />
              )}
              {step === 2 && <ConfirmProgramStep />}
              {step === 3 && <WelcomeStep />}
            </div>

            {/* mt-auto pushes this to the bottom of the flex-1 form on
                mobile (matching Figma); md:mt-8 overrides that back to a
                normal fixed gap on desktop, where the card isn't
                full-height-stretched so "auto" would otherwise collapse
                to 0 and the button would sit flush against the fields. */}
            <Button
              type="submit"
              size="lg"
              pill
              variant="primary"
              disabled={!canContinue}
              className="mt-auto w-full justify-center md:mt-8"
            >
              {isSubmitting ? "Continuing..." : ctaLabel}
            </Button>
          </form>
        </div>

        {step === 2 && (
          <p className="mt-4 text-center text-sm text-neutral-600">
            Something&apos;s wrong?{" "}
            <a href="#" className="text-primary-600 underline-offset-4 hover:underline">
              Contact support
            </a>
          </p>
        )}
      </div>
    </main>
  )
}