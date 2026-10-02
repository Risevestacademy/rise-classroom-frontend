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
import { Logo } from "@/assets/logo"
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

          <div className="flex flex-col gap-6 px-6 py-10 sm:px-12 lg:px-24">
            <div className="mx-auto flex h-[140px] my-10 w-full  items-center justify-center">
              <Image className="rounded-2xl" src="/sign-in.png" alt="Sign in to your account" width={500} height={0} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Welcome Back</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Sign in to your Classroom account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              {formError && (
                <p
                  role="alert"
                  className="rounded-lg border border-semantic-border-error bg-semantic-surface-error-badge px-4 py-3 text-sm text-semantic-text-error"
                >
                  {formError}
                </p>
              )}

              <Field.Root
                className="flex flex-col gap-1.5"
                invalid={Boolean(errors.email)}
              >
                <label className="text-sm font-medium text-neutral-800">Email Address</label>
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
                className="flex flex-col gap-1.5"
                invalid={Boolean(errors.password)}
              >
                <label htmlFor="password" className="text-sm font-medium text-neutral-800">
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

              <div className="text-right text-sm">
                <Link href="/forgot-password" className="font-medium text-primary-500 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!formFilled || submitting}
                className="w-full rounded-full cursor-pointer"
              >
                {submitting ? "Signing in…" : "Sign in"}
              </Button>

              <p className="text-center text-sm text-neutral-600">
                Haven&apos;t been invited?{" "}
                <Link href="#" className="font-medium text-primary-500 hover:underline">
                  Contact Support
                </Link>
              </p>
            </form>
          </div>

        </div>
      </div>
    </main>
  )
}
