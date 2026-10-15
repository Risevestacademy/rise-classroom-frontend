import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Solutions", href: "#solutions" },
  { label: "Pricing", href: "#pricing" },
];

export function LandingNav() {
  return (
    <header
      data-landing-nav
      className="group fixed inset-x-0 top-0 z-50 bg-white transition-[background-color,box-shadow] duration-500 data-[scrolled=true]:bg-white/80 data-[scrolled=true]:shadow-[0_1px_0_rgb(17_24_25/0.06)] data-[scrolled=true]:backdrop-blur-md"
    >
      <nav
        data-intro="nav"
        className="mx-auto flex h-[100px] w-full max-w-[1200px] items-center px-4 transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[scrolled=true]:h-[72px] xl:px-0"
      >
        <Link href="/" aria-label="Rise Classroom home" className="shrink-0">
          <Image
            src="/logo-full-green.svg"
            alt="Rise Classroom"
            width={137}
            height={39}
            preload
          />
        </Link>

        <ul className="ml-[294px] hidden items-center gap-[52px] lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="relative text-[14px] leading-5 font-medium text-text-primary after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.16,1,0.3,1)] hover:after:origin-left hover:after:scale-x-100"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/sign-in"
            className="landing-btn flex h-10 items-center rounded-[14px] border border-neutral-200 bg-white px-4 text-[14px] leading-5 font-medium text-text-secondary [--btn-fill:var(--color-neutral-100)]"
          >
            Sign in
          </Link>
          <Link
            href="/onboarding/create-account"
            className="landing-btn flex h-10 items-center rounded-[14px] bg-brand-950 px-4 text-[14px] leading-5 font-medium text-white"
          >
            Start for free
          </Link>
        </div>
      </nav>
    </header>
  );
}
