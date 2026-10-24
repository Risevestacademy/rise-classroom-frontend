"use client"

import { Suspense, useState } from "react"
import { z } from "zod";

import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { Field } from "@base-ui/react/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Error } from "@/components/ui/hint"
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle"
import { SquareLock } from "@/assets/icons"
import { AuthShell } from "@/components/AuthShell"
import { getSignInErrorMessage, landingPathFor, signIn } from "@/lib/auth"

const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please input valid email address."),
  password: z.string().min(1, "Password is required."),
});

/**
 * Where to go after signing in. Only same-site paths are honoured, so a crafted
 * `?next=https://evil.example` link can't bounce someone off the site.
 */
function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return null
  }
  return next
}

// useSearchParams needs a Suspense boundary for the page to prerender.
export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}

function SignInForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const nextPath = safeNextPath(useSearchParams().get("next"))

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setFormError(null);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setFormError(null);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const formFilled = email.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = signInSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const { user } = await signIn({
        email: result.data.email.trim(),
        password: result.data.password,
      });

      if (user.status === "SUSPENDED") {
        setFormError("This account has been suspended. Please contact support.");
        return;
      }

      // Drop the signed-out session cached before this sign-in, or the area
      // guard would read it and send the user straight back here.
      queryClient.removeQueries({ queryKey: ["auth", "session"] })
      router.push(nextPath ?? landingPathFor(user));
    } catch (error) {
      setFormError(getSignInErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <Image
        className="h-auto w-full rounded-2xl"
        src="/login.png"
        alt="Sign in to your account"
        width={358}
        height={113}
        priority
      />

      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Welcome back</h1>
        <p className="mt-2 max-w-60 font-work text-sm text-neutral-500">
          Sign in to continue your learning journey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-border-error bg-surface-error-badge px-4 py-3 text-sm text-text-error"
          >
            {formError}
          </p>
        )}

        <Field.Root
          className="flex flex-col gap-2"
          invalid={Boolean(errors.email)}
        >
          <label className="text-sm font-medium text-neutral-700">Email Address</label>
          <Input
            type="email"
            value={email}
            onChange={handleEmailChange}
            disabled={submitting}
            placeholder="rise@email.com"
          />
          {errors.email && <Error match={true}>{errors.email}</Error>}
        </Field.Root>

        <Field.Root
          className="flex flex-col gap-2"
          invalid={Boolean(errors.password)}
        >
          <label htmlFor="password" className="text-sm font-medium text-neutral-700">
            Password
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
            placeholder="Enter your password"
            value={password}
            onChange={handlePasswordChange}
            disabled={submitting}
          />

          {errors.password && <Error match={true}>{errors.password}</Error>}
        </Field.Root>

        <div className="text-right font-work text-sm">
          <Link href="/forgot-password" className="text-brand-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!formFilled || submitting}
          className="mt-6 w-full cursor-pointer rounded-full"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>

        <p className="mt-2 text-center font-work text-sm text-neutral-800">
          Haven&apos;t been invited?{" "}
          <Link href="#" className="text-brand-primary hover:underline">
            Contact support
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
