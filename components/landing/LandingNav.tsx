import Image from "next/image";
import Link from "next/link";

import { RollText } from "@/components/landing/RollText";

/* Rooted at "/" so they also work from other pages, like the privacy policy. */
const NAV_LINKS = [
  { label: "Product", href: "/#product" },
  { label: "Solutions", href: "/#solutions" },
  { label: "Pricing", href: "/#pricing" },
  // Same inbox as the footer and the pricing section's "Contact us".
  { label: "Contact", href: "mailto:contact@riseclassroom.com" },
];

/* intro={false} leaves out the hero intro hook, which keeps the nav hidden
   until the home page's intro animation shows it. */
export function LandingNav({ intro = true }: { intro?: boolean }) {
  return (
    <header
      data-landing-nav
      className="group pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 lg:pt-8"
    >
      <nav
        data-intro={intro ? "nav" : undefined}
        className="pointer-events-auto mx-auto flex h-12 w-full max-w-[800px] items-center justify-between rounded-full bg-white/80 py-2 pr-2 pl-4 backdrop-blur-md transition-shadow duration-500 group-data-[scrolled=true]:shadow-[0_8px_24px_rgb(16_22_79/0.12)] lg:px-4"
      >
        <Link href="/" aria-label="Rise Classroom home" className="shrink-0">
          <Image
            src="/logo-full-green.svg"
            alt="Rise Classroom"
            width={112}
            height={32}
            preload
            className="h-8 w-auto"
          />
        </Link>

        <ul className="hidden items-center lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="flex h-10 w-[80px] items-center justify-center rounded-lg text-[14px] leading-5 font-medium text-[#1E1E1E]"
              >
                <RollText>{link.label}</RollText>
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <Link
            href="/sign-in"
            className="landing-btn flex h-10 items-center rounded-2xl px-4 text-[14px] leading-5 font-medium text-text-brand [--btn-fill:var(--color-brand-50)]"
          >
            <RollText>Sign in</RollText>
          </Link>
          <Link
            href="/sign-up"
            className="landing-btn flex h-10 items-center rounded-full border-2 border-brand-400 bg-brand-900 px-4 text-[14px] leading-5 font-medium text-white"
          >
            <RollText>Start for free</RollText>
          </Link>
        </div>
      </nav>
    </header>
  );
}
