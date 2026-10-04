"use client"

import { Suspense, useMemo, useState } from "react"
import { z } from "zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Field } from "@base-ui/react/field"
import { AlertCircle, CheckCircle2, MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Error, Hint } from "@/components/ui/hint"
import { Skeleton } from "@/components/ui/skeleton"
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle"
import { AuthShell } from "@/components/AuthShell"
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter"
import { SquareLock } from "@/assets/icons"
import { landingPathFor, signIn } from "@/lib/auth"
import { evaluatePassword } from "@/lib/password-strength"
import {
  getPasswordResetErrorMessage,
  passwordResetQueries,
  requestPasswordReset,
  resetPassword,
} from "@/lib/password-reset"

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please input valid email address."),
})

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-border-error bg-surface-error-badge px-4 py-3 text-sm text-text-error"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

function StatusIcon({
  tone,
  children,
}: {
  tone: "success" | "error"
  children: React.ReactNode
}) {
  return (
    <span
      className={
        tone === "success"
          ? "flex h-14 w-14 items-center justify-center rounded-full bg-surface-success-badge text-text-success"
          : "flex h-14 w-14 items-center justify-center rounded-full bg-surface-error-badge text-text-error"
      }
    >
      {children}
    </span>
  )
}

function BackToSignIn({ prefix }: { prefix?: string }) {
  return (
    <p className="text-center text-sm text-neutral-500">
      {prefix && `${prefix} `}
      <Link href="/sign-in" className="font-medium text-brand-primary hover:underline">
        Back to Sign In
      </Link>
    </p>
  )
}

/* Step 1 — no token: ask for the email to send a reset link to. */

function RequestResetLink() {
  const [email, setEmail] = useState("")
  const [fieldError, setFieldError] = useState<string>()
  const [sentTo, setSentTo] = useState<string | null>(null)

  const request = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (_, address) => setSentTo(address),
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const result = emailSchema.safeParse({ email })
    if (!result.success) {
      setFieldError(result.error.flatten().fieldErrors.email?.[0])
      return
    }

    request.mutate(result.data.email)
  }

  if (sentTo) {
    return (
      <>
        <StatusIcon tone="success">
          <MailCheck className="h-7 w-7" />
        </StatusIcon>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Check your email</h1>
          <p className="mt-1 text-sm text-neutral-500">
            If an account exists for{" "}
            <span className="font-medium text-neutral-700">{sentTo}</span>, we&apos;ve
            sent a link to reset your password. It expires in 30 minutes.
          </p>
        </div>

        {request.isError && (
          <FormError>{getPasswordResetErrorMessage(request.error)}</FormError>
        )}

        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={request.isPending}
          onClick={() => request.mutate(sentTo)}
          className="w-full rounded-full cursor-pointer"
        >
          {request.isPending ? "Resending…" : "Resend Email"}
        </Button>

        <BackToSignIn prefix="Remembered it?" />
      </>
    )
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Forgot your password?</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Enter the email address associated with your Rise Classroom account
          and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Field.Root className="flex flex-col gap-1.5" invalid={Boolean(fieldError)}>
          <label htmlFor="email" className="text-sm font-medium text-neutral-700">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setEmail(event.target.value)
              setFieldError(undefined)
              request.reset()
            }}
            placeholder="rise@email.com"
          />
          {fieldError && <Error match={true}>{fieldError}</Error>}
        </Field.Root>

        {request.isError && (
          <FormError>{getPasswordResetErrorMessage(request.error)}</FormError>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={email.trim() === "" || request.isPending}
          className="w-full rounded-full cursor-pointer"
        >
          {request.isPending ? "Sending reset link…" : "Send Reset Link"}
        </Button>

        <BackToSignIn />
      </form>
    </>
  )
}

/* Step 2 — arrived from the email link: choose a new password. */

function ChooseNewPassword({ token }: { token: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const link = useQuery(passwordResetQueries.verifyLink(token))

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { allRequirementsMet } = useMemo(() => evaluatePassword(password), [password])
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  // Resets the password, then signs straight in with it. Sign-in failing isn't
  // fatal — the password did change — so they're just sent to sign in instead.
  const reset = useMutation({
    mutationFn: async () => {
      if (!link.data) throw new globalThis.Error("Reset link not verified")

      const { email, resetToken } = link.data
      await resetPassword({ email, password, confirmPassword }, resetToken)

      try {
        const { user } = await signIn({ email, password })
        return landingPathFor(user)
      } catch {
        return "/sign-in"
      }
    },
    onSuccess: () => {
      // The reset signed out every old session, so any cached one is stale.
      queryClient.removeQueries({ queryKey: ["auth", "session"] })
    },
  })

  if (link.isPending) {
    return (
      <>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-full" />
      </>
    )
  }

  if (link.isError) {
    return (
      <>
        <StatusIcon tone="error">
          <AlertCircle className="h-7 w-7" />
        </StatusIcon>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">This link isn&apos;t valid</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {getPasswordResetErrorMessage(link.error)} Reset links work once and
            expire after 30 minutes, so request a new one below.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-full cursor-pointer"
          nativeButton={false}
          render={<Link href="/forgot-password" />}
        >
          Request a New Link
        </Button>
        <BackToSignIn />
      </>
    )
  }

  if (reset.isSuccess) {
    const signedIn = reset.data !== "/sign-in"

    return (
      <>
        <StatusIcon tone="success">
          <CheckCircle2 className="h-7 w-7" />
        </StatusIcon>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Password updated</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {signedIn
              ? "Your password has been reset and you're signed in. Any other devices have been signed out."
              : "Your password has been reset. Sign in with your new password to continue."}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => router.push(reset.data)}
          className="w-full rounded-full cursor-pointer"
        >
          {signedIn ? "Continue" : "Sign In"}
        </Button>
      </>
    )
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (allRequirementsMet && passwordsMatch) reset.mutate()
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Create a new password</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Field.Root className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Email Address</label>
          <Input type="email" value={link.data.email} disabled readOnly />
          <Hint>The account this reset link was sent to</Hint>
        </Field.Root>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-neutral-700">
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
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setPassword(event.target.value)
              reset.reset()
            }}
          />
          <PasswordStrengthMeter password={password} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password" className="text-sm font-medium text-neutral-700">
            Confirm New Password
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
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfirmPassword(event.target.value)
              reset.reset()
            }}
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-text-error">Passwords don&apos;t match.</p>
          )}
        </div>

        {reset.isError && <FormError>{getPasswordResetErrorMessage(reset.error)}</FormError>}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!allRequirementsMet || !passwordsMatch || reset.isPending}
          className="w-full rounded-full cursor-pointer"
        >
          {reset.isPending ? "Resetting…" : "Reset Password"}
        </Button>
      </form>
    </>
  )
}

function ForgotPasswordFlow() {
  const token = useSearchParams().get("token") ?? ""

  return (
    <AuthShell>
      {token ? <ChooseNewPassword token={token} /> : <RequestResetLink />}
    </AuthShell>
  )
}

// useSearchParams needs a Suspense boundary for the page to prerender.
export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </AuthShell>
      }
    >
      <ForgotPasswordFlow />
    </Suspense>
  )
}
