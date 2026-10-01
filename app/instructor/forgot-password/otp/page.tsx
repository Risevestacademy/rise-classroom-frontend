"use client"

import { useEffect, useState } from "react"
import { z } from "zod"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { Field } from "@base-ui/react/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Error } from "@/components/ui/hint"
import { Logo } from "@/assets/logo"
import { api, ApiError } from "@/lib/api"

const otpSchema = z.object({
  otp: z
    .string()
    .min(1, "Code is required.")
    .min(6, "Enter the 6-digit code sent to your email."),
})

export default function ForgotPasswordOtpPage() {
  const router = useRouter()

  const [email, setEmail] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [errors, setErrors] = useState<{ otp?: string }>({})
  const [isResending, setIsResending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("forgotPasswordEmail")

    if (!storedEmail) {
      router.replace("/instructor/forgot-password")
      return
    }

    setEmail(storedEmail)
  }, [router])

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value)
    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: undefined }))
    }
    if (formError) {
      setFormError(null)
    }
  }

  const formFilled = otp.trim() !== ""

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = otpSchema.safeParse({ otp })

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        otp: fieldErrors.otp?.[0],
      })
      return
    }

    setErrors({})
    setFormError(null)

    sessionStorage.setItem("forgotPasswordOtp", otp)
    router.push("/instructor/forgot-password/reset")
  }

  const handleResend = async () => {
    if (!email) return

    setIsResending(true)
    setFormError(null)
    setResendMessage(null)

    try {
      await api.post<{ status: boolean }>("/auth/forget-password/email-otp", {
        email,
      })
      setResendMessage("A new code has been sent to your email.")
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(
          Array.isArray(error.message) ? error.message.join(" ") : error.message
        )
      } else {
        setFormError("Something went wrong. Please try again.")
      }
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return null
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

          <div className="flex flex-col gap-6 px-6 py-10 sm:px-12 lg:px-24 lg:justify-center">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Check your email</h1>
              <p className="mt-1 text-sm text-neutral-600">
                We sent a verification code to <span className="font-medium text-neutral-800">{email}</span>.
                Enter it below to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <Field.Root
                className="flex flex-col gap-1.5"
                invalid={Boolean(errors.otp)}
              >
                <label className="text-sm font-medium text-neutral-800">Verification Code</label>
                <Input
                  type="basic"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="123456"
                />
                {errors.otp && <Error match={true}>{errors.otp}</Error>}
              </Field.Root>

              {formError && (
                <p className="flex items-center gap-1 text-xs text-semantic-text-error">
                  {formError}
                </p>
              )}
              {resendMessage && (
                <p className="text-sm text-primary-500">{resendMessage}</p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!formFilled}
                className="w-full rounded-full cursor-pointer"
              >
                Continue
              </Button>

              <p className="text-center text-sm text-neutral-600">
                Didn&apos;t get a code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-medium text-primary-500 hover:underline disabled:opacity-60 cursor-pointer"
                >
                  {isResending ? "Resending..." : "Resend code"}
                </button>
              </p>

              <p className="text-center text-sm text-neutral-600">
                <Link href="/instructor/sign-in" className="font-medium text-primary-500 hover:underline">
                  Back to Sign In
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
