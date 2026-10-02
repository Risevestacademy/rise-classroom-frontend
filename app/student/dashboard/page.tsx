"use client"

import { useState } from "react"
import { z } from "zod"

import Link from "next/link"

import { Field } from "@base-ui/react/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Error } from "@/components/ui/hint"
import { Logo } from "@/assets/logo"
import { api, ApiError } from "@/lib/api"

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please input valid email address."),
})

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return Array.isArray(error.message) ? error.message.join(" ") : error.message
  }
  return "Something went wrong. Please try again."
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<{ email?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }))
    }
    if (formError) {
      setFormError(null)
    }
  }

  const formFilled = email.trim() !== ""

  const requestResetLink = async () => {
    await api.post<{ success: boolean; message: string }>("/auth/forgot-password", {
      email,
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = forgotPasswordSchema.safeParse({ email })

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({ email: fieldErrors.email?.[0] })
      return
    }

    setErrors({})
    setFormError(null)
    setIsLoading(true)

    try {
      await requestResetLink()
      sessionStorage.setItem("passwordResetRole", "student")
      setSubmitted(true)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setFormError(null)

    try {
      await requestResetLink()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsResending(false)
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

          <div className="flex flex-col gap-6 px-6 py-10 sm:px-12 lg:px-24 lg:justify-center">
            {!submitted ? (
              <>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">Forgot your password?</h1>
                  <p className="mt-1 text-sm text-neutral-600">
                    Enter the email address associated with your Rise Classroom
                    account and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                  <Field.Root
                    className="flex flex-col gap-1.5"
                    invalid={Boolean(errors.email)}
                  >
                    <label className="text-sm font-medium text-neutral-800">Email Address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="rise@email.com"
                    />
                    {errors.email && <Error match={true}>{errors.email}</Error>}
                  </Field.Root>

                  {formError && (
                    <p className="flex items-center gap-1 text-xs text-semantic-text-error">
                      {formError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={!formFilled || isLoading}
                    className="w-full rounded-full cursor-pointer"
                  >
                    {isLoading ? "Sending reset link..." : "Send Reset Link"}
                  </Button>

                  <p className="text-center text-sm text-neutral-600">
                    <Link href="/student/sign-in" className="font-medium text-primary-500 hover:underline">
                      Back to Sign In
                    </Link>
                  </p>
                </form>
              </>
            ) : (
              <>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">Reset your password</h1>
                  <p className="mt-1 text-sm text-neutral-600">
                    If an account exists for <span className="font-medium text-neutral-800">{email}</span>,
                    we&apos;ve sent a link to reset your password. Click the link in
                    the email to continue — it expires in 30 minutes.
                  </p>
                </div>

                {formError && (
                  <p className="flex items-center gap-1 text-xs text-semantic-text-error">
                    {formError}
                  </p>
                )}

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={isResending}
                  onClick={handleResend}
                  className="w-full rounded-full cursor-pointer"
                >
                  {isResending ? "Resending..." : "Resend Email"}
                </Button>

                <p className="text-center text-sm text-neutral-600">
                  Didn&apos;t request this?{" "}
                  <Link href="/student/sign-in" className="font-medium text-primary-500 hover:underline">
                    Back to Sign In
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
