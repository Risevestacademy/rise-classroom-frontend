"use client"

import { useState } from "react"
import { z } from "zod";

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Field } from "@base-ui/react/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Error } from "@/components/ui/hint"
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle"
import { SquareLock } from "@/assets/icons"
import { Logo } from "@/assets/logo"

const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please input valid email address."),
  password: z.string().min(1, "Password is required."),
});

export default function SignInPage() {
  const router = useRouter()

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const formFilled = email.trim() !== "" && password.trim() !== "";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
    router.push("/dashboard")
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
                Sign in to continue your learning experience
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
                disabled={!formFilled}
                className="w-full rounded-full cursor-pointer"
              >
                Sign in
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