"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { User } from "@/assets/icons"
import { Logo } from "@/assets/logo"
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
    subtitle: "Review your program and teaching assignment before continuing.",
    ctaLabel: "Yes, continue",
  },
  3: {
    title: "Welcome to Rise Classroom",
    subtitle: "Your teaching space is ready. Let’s get you set up to support your learners.",
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

      <div className="flex flex-col gap-5">
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
    <main className="min-h-[100vh] bg-neutral-100 lg:flex lg:items-center lg:justify-center lg:p-4">
      <div className="mx-auto w-full md:w-[100vw] lg:grid lg:grid-cols-2 lg:overflow-hidden">
        <aside className="hidden flex-col justify-between rounded-lg bg-primary-700 p-10 text-white lg:flex">
          <div className="flex flex-1 items-center justify-center">
            <Logo variant="white" size="lg" />
          </div>
          <p className="flex w-4/5 justify-center text-2xl font-bold">
            Learn. Practice. Progress.
          </p>
        </aside>

        <div className="flex flex-col min-h-[100vh]">
          <div className="flex items-center px-6 pt-6 lg:hidden">
            <Logo variant="teal" size="sm" />
          </div>

          <div className="flex flex-col gap-6 px-6 py-10 sm:px-12 lg:px-24">
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
              <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                pill
                disabled={!canContinue}
                className="w-full justify-center rounded-full cursor-pointer"
              >
                {isSubmitting ? "Continuing..." : ctaLabel}
              </Button>

              {step === 2 && (
                <p className="text-center text-sm text-neutral-600">
                  Something&apos;s wrong?{" "}
                  <a
                    href="#"
                    className="font-medium text-primary-500 hover:underline"
                  >
                    Contact support
                  </a>
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
