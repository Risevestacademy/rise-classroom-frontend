import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Logo } from "@/assets/logo"

export default function InvitePage() {
  return (
    <main className="min-h-[100vh] bg-neutral-100 lg:flex lg:items-center lg:justify-center lg:p-4">
      <div className="mx-auto w-full md:w-[100vw] lg:grid lg:grid-cols-2 lg:overflow-hidden ">
        <div className="relative hidden flex-col justify-between rounded-lg bg-primary-500 p-10 lg:flex">
          <div className="flex flex-1 items-center justify-center">
            <Logo variant="white" size="lg" />
          </div>
        </div>

        <div className="flex flex-col ">
          <div className="flex items-center px-6 pt-6 lg:hidden">
            <Logo variant="teal" size="sm" />
          </div>

          <div className="flex flex-col gap-8 px-6 py-10 sm:px-12 lg:px-24">
            <h1 className="text-xl font-bold text-neutral-900">
              Your invitation to Rise Academy has been accepted
            </h1>

            <div className="h-[350px] w-full rounded-2xl bg-[#e8f5f6]" />

            <div className="flex flex-col gap-6">
              <p className="text-lg font-semibold text-neutral-900">
                Your account is almost ready. Let&apos;s get you set up.
              </p>

              <Button
                variant="primary"
                size="lg"
                className="w-full cursor-pointer rounded-full"
                nativeButton={false}
                render={<Link href="/student/create-account" />}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
