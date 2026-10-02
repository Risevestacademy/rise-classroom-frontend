"use client"

import { Suspense, useEffect, useState } from "react"
import { z } from "zod"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Field } from "@base-ui/react/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Error } from "@/components/ui/hint"
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle"
import { SquareLock } from "@/assets/icons"
import { Logo } from "@/assets/logo"
import { api, ApiError } from "@/lib/api"

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

type VerifyState = "verifying" | "valid" | "invalid"

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return Array.isArray(error.message) ? error.message.join(" ") : error.message
  }
  return "Something went wrong. Please try again."
}

function Shell({ children }: { children: React.ReactNode }) {
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
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [roleHint] = useState<"student" | "instructor" | null>(() => {
    if (typeof window === "undefined") return null
    const stored = sessionStorage.getItem("passwordResetRole")
    return stored === "student" || stored === "instructor" ? stored : null
  })

  const [verifyState, setVerifyState] = useState<VerifyState>("verifying")
  const [email, setEmail] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setVerifyState("invalid")
      return
    }

    let cancelled = false

    const verify = async () => {
      try {
        const response = await api.post<{
          success: boolean
          data: {
            status: string
            email: string
            resetToken: string
            expiresIn: number
          }
        }>("/auth/reset-password/verify", { token })

        if (cancelled) return
        setEmail(response.data.email)
        setResetToken(response.data.resetToken)
        setVerifyState("valid")
      } catch {
        if (cancelled) return
        setVerifyState("invalid")
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [token])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
    if (formError) setFormError(null)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
    if (formError) setFormError(null)
  }

  const formFilled = password.trim() !== "" && confirmPassword.trim() !== ""

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email || !resetToken) return

    const result = resetPasswordSchema.safeParse({ password, confirmPassword })

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      })
      return
    }

    setErrors({})
    setFormError(null)
    setIsLoading(true)

    try {
      await api.post<{ success: boolean; message: string }>(
        "/auth/reset-password",
        { email, password, confirmPassword },
        { headers: { Authorization: `Bearer ${resetToken}` } }
      )

      sessionStorage.removeItem("passwordResetRole")
      setIsDone(true)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  if (verifyState === "verifying") {
    return (
      <Shell>
        <p className="text-sm text-neutral-600">Verifying your reset link...</p>
      </Shell>
    )
  }

  if (verifyState === "invalid") {
    return (
      <Shell>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">This link isn&apos;t valid</h1>
          <p className="mt-1 text-sm text-neutral-600">
            This password reset link is invalid, expired, or has already been
            used. Request a new one from the sign-in page.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {roleHint !== "instructor" && (
            <Link href="/student/forgot-password">
              <Button type="button" variant="primary" size="lg" className="w-full rounded-full cursor-pointer">
                {roleHint === "student" ? "Request New Link" : "Request New Link — Student"}
              </Button>
            </Link>
          )}
          {roleHint !== "student" && (
            <Link href="/instructor/forgot-password">
              <Button type="button" variant="primary" size="lg" className="w-full rounded-full cursor-pointer">
                {roleHint === "instructor" ? "Request New Link" : "Request New Link — Instructor"}
              </Button>
            </Link>
          )}
        </div>
      </Shell>
    )
  }

  if (isDone) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Password updated</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Your password has been reset. You can now sign in with your new
              password.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {roleHint !== "instructor" && (
            <Link href="/student/sign-in">
              <Button type="button" variant="primary" size="lg" className="w-full rounded-full cursor-pointer">
                {roleHint === "student" ? "Sign In" : "Sign In — Student"}
              </Button>
            </Link>
          )}
          {roleHint !== "student" && (
            <Link href="/instructor/sign-in">
              <Button type="button" variant="primary" size="lg" className="w-full rounded-full cursor-pointer">
                {roleHint === "instructor" ? "Sign In" : "Sign In — Instructor"}
              </Button>
            </Link>
          )}
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Create a new password</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Field.Root className="flex flex-col gap-1.5" invalid={Boolean(errors.password)}>
          <label htmlFor="password" className="text-sm font-medium text-neutral-800">
            New Password
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
            placeholder="Enter new password"
            value={password}
            onChange={handlePasswordChange}
          />
          {errors.password && <Error match={true}>{errors.password}</Error>}
        </Field.Root>

        <Field.Root className="flex flex-col gap-1.5" invalid={Boolean(errors.confirmPassword)}>
          <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-800">
            Confirm New Password
          </label>
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "basic" : "password"}
            leadingIcon={<SquareLock />}
            trailingIcon={
              <PasswordVisibilityToggle
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((value) => !value)}
              />
            }
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
          />
          {errors.confirmPassword && <Error match={true}>{errors.confirmPassword}</Error>}
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
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </Shell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  )
}
