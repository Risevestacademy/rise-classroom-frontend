import { Logo } from "@/assets/logo";
import { cn } from "@/lib/utils";

/**
 * Brand panel on the left, the current step on the right. Shared by the signed-out flows.
 * Proportions follow the 1440px design: a 654px panel beside a 770px column, with the
 * 358px form centred in that column.
 *
 * The `plain` panel is the sign-up design's: wider (759px beside 665px) and empty,
 * because those steps show the logo above the form instead.
 */
export function AuthShell({
  panel = "branded",
  children,
}: {
  panel?: "branded" | "plain";
  children: React.ReactNode;
}) {
  const plain = panel === "plain";

  return (
    <main
      className={cn(
        "min-h-dvh bg-neutral-50 lg:grid lg:py-4 lg:pl-4",
        plain ? "lg:grid-cols-[759fr_665fr]" : "lg:grid-cols-[654fr_770fr]",
      )}
    >
      {/* Stays in view while a long step scrolls. */}
      <div className="sticky top-4 hidden h-[calc(100dvh-2rem)] rounded-lg bg-brand-primary lg:block">
        {!plain && (
          <>
            <div className="absolute inset-x-0 top-[48.4%] flex -translate-y-1/2 justify-center">
              <Logo variant="white" size="lg" />
            </div>
            <p className="absolute inset-x-0 bottom-18 text-center text-2xl font-bold [word-spacing:0.3rem] text-neutral-0">
              Learn. Practice. Progress.
            </p>
          </>
        )}
      </div>

      <div className="flex min-h-dvh flex-col lg:min-h-[calc(100dvh-2rem)]">
        {!plain && (
          <div className="flex items-center px-6 pt-6 lg:hidden">
            <Logo variant="teal" size="sm" />
          </div>
        )}

        <div className="mx-auto flex w-full max-w-[406px] flex-1 flex-col justify-center gap-6 px-6 py-10">
          {children}
        </div>
      </div>
    </main>
  );
}
