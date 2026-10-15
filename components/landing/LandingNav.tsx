import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Solutions", href: "#solutions" },
  { label: "Pricing", href: "#pricing" },
];

export function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white">
      <nav className="mx-auto flex h-[100px] w-full max-w-[1200px] items-center px-4 xl:px-0">
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
                className="text-[14px] leading-5 font-medium text-text-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/sign-in"
            className="flex h-10 items-center rounded-[14px] border border-neutral-200 bg-white px-4 text-[14px] leading-5 font-medium text-text-secondary"
          >
            Sign in
          </Link>
          <Link
            href="/onboarding/create-account"
            className="flex h-10 items-center rounded-[14px] bg-brand-950 px-4 text-[14px] leading-5 font-medium text-white"
          >
            Start for free
          </Link>
        </div>
      </nav>
    </header>
  );
}
