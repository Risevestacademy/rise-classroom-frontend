import { Button } from "@/components/ui/button"
import { Logo } from "@/assets/logo"

export default function CreateAccountSuccessPage() {
  return (
    <main className="min-h-[screen] bg-neutral-100 lg:flex lg:items-center lg:justify-center lg:p-4">
      <div className="mx-auto w-full md:w-[100vw] lg:grid lg:grid-cols-2 lg:overflow-hidden ">
        <div className="relative hidden flex-col justify-between rounded-lg bg-primary-500 p-10 lg:flex">
          <div className="flex flex-1 items-center justify-center">
            <Logo variant="white" size="lg" />
          </div>
          <p className="text-4xl [word-spacing:0.8rem] leading-tight font-bold text-neutral-50">
            Learn. Practice. Progress.
          </p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center px-6 pt-6 lg:hidden">
            <Logo variant="teal" size="sm" />
          </div>

          <div className="flex flex-col gap-6 px-6 py-10 sm:px-12 lg:px-24">
            <div className="flex min-h-screen flex-col mt-15 md:justify-evenly">
              <h1 className="text-xl font-bold text-neutral-900">Account created!</h1>
              <p className="text-sm text-neutral-500 md:hidden">Your Rise Classroom account is ready.</p>
              <div className="flex flex-col gap-1 my-auto">
                <p className="text-sm text-neutral-500 hidden md:block">Your Rise Classroom account is ready.</p>
                <p className="text-sm font-semibold text-neutral-900">
                  Let&apos;s complete your profile so we can personalize your experience.
                </p>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="mt-6 w-full cursor-pointer rounded-full"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
