"use client"

import { useEffect, useState } from "react"
import { z } from "zod"

import { useRouter } from "next/navigation"

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

export default function ForgotPasswordResetPage() {
  const router = useRouter()

  const [email, setEmail] = useState<string | null>(null)
  const [otp, setOtp] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("forgotPasswordEmail")
    const storedOtp = sessionStorage.getItem("forgotPasswordOtp")

    if (!storedEmail || !storedOtp) {
      router.replace("/instructor/forgot-password")
      return
    }

    setEmail(storedEmail)
    setOtp(storedOtp)
  }, [router])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }))
    }
    if (formError) {
      setFormError(null)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
    }
    if (formError) {
      setFormError(null)
    }
  }

  const formFilled = password.trim() !== "" && confirmPassword.trim() !== ""

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email || !otp) return

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
      await api.post<{ status: boolean }>("/auth/reset-password/email-otp", {
        email,
        otp,
        password,
      })

      sessionStorage.removeItem("forgotPasswordEmail")
      sessionStorage.removeItem("forgotPasswordOtp")

      router.push("/instructor/sign-in?passwordReset=success")
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(
          Array.isArray(error.message) ? error.message.join(" ") : error.message
        )
      } else {
        setFormError("Something went wrong. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!email || !otp) {
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
              <h1 className="text-2xl font-bold text-neutral-900">Set a new password</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Choose a new password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <Field.Root
                className="flex flex-col gap-1.5"
                invalid={Boolean(errors.password)}
              >
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

              <Field.Root
                className="flex flex-col gap-1.5"
                invalid={Boolean(errors.confirmPassword)}
              >
                <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-800">
                  Confirm Password
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
          </div>
        </div>
      </div>
    </main>
  )
}
