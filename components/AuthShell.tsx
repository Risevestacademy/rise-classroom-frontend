import { Logo } from "@/assets/logo";

/** Brand panel on the left, the current step on the right. Shared by the signed-out flows. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100vh] bg-neutral-50 lg:flex lg:items-center lg:justify-center lg:p-4">
      <div className="mx-auto w-full md:w-[100vw] lg:grid lg:grid-cols-2 lg:overflow-hidden">
        <div className="relative hidden flex-col justify-between rounded-lg bg-brand-primary p-10 lg:flex">
          <div className="flex flex-1 items-center justify-center">
            <Logo variant="white" size="lg" />
          </div>
          <p className="text-4xl [word-spacing:0.8rem] leading-tight font-bold text-neutral-0">
            Learn. Practice. Progress.
          </p>
        </div>

        <div className="flex min-h-[100vh] flex-col">
          <div className="flex items-center px-6 pt-6 lg:hidden">
            <Logo variant="teal" size="sm" />
          </div>

          <div className="flex flex-col gap-6 px-6 py-10 sm:px-12 lg:px-24">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
