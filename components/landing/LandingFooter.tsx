import Image from "next/image";
import Link from "next/link";

// TODO: Contact, Help Center and the legal pages don't exist yet; point these at them when they do.
const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Overview", href: "#product" },
      { label: "Features", href: "#solutions" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "For Organizations", href: "#solutions" },
      { label: "For Instructors", href: "#solutions" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQs", href: "#faq" },
      { label: "Contact", href: "#" },
      { label: "Help Center", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

/**
 * Sits behind the page and is revealed as the content above scrolls away. It
 * tucks 40px under main's rounded bottom (-mt-10, matching its radius) so the
 * corners show navy, and is 40px taller than the screen so that tucked strip
 * is scrolled away and the footer fills the screen at the end.
 * When it's taller than the screen, LandingMotion sets --footer-offset so it
 * pins by its top edge instead and nothing is left hidden.
 */
export function LandingFooter() {
  return (
    <footer
      data-landing-footer
      className="sticky bottom-[var(--footer-offset,0px)] -mt-10 flex min-h-[calc(100svh+40px)] flex-col bg-brand-950 px-4 pt-20 pb-10 lg:h-[calc(100svh+40px)] lg:min-h-fit lg:px-[96px] lg:pt-[100px] lg:pb-[38px]"
    >
      {/* One centred column so the nav ends where "Classroom" ends on wide
          screens. On short screens it narrows, which shrinks the wordmark
          (~0.28 × width tall) until the footer fits the screen height. */}
      <div className="mx-auto flex w-full flex-1 flex-col justify-between gap-16 lg:max-w-[min(1248px,calc((100svh_-_254px)*3.6))] lg:gap-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <Link href="/" aria-label="Rise Classroom home" className="shrink-0">
            <Image
              src="/classroom-logo-white.svg"
              alt=""
              width={74}
              height={60}
            />
          </Link>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-[46px] gap-y-8 sm:flex"
          >
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="text-[18px] leading-6 font-medium text-[#f4f7f7]">
                  {column.title}
                </h2>
                <ul className="mt-4 flex flex-col gap-2">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="block font-work text-[14px] leading-5 tracking-[-0.01em] whitespace-nowrap text-[#aab7b8] transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Sizes are in cqw so "Classroom" always spans the full width and the
            copyright stays lined up with the end of it. */}
        <div
          data-footer-wordmark
          className="@container relative w-full"
        >
          <span className="sr-only">Rise Classroom</span>
          <div aria-hidden className="leading-none font-normal select-none">
            {/* The taller line box keeps the dot on the "i" inside the reveal clip. */}
            <p className="wordmark-dots w-fit text-[length:7.9cqw] leading-[1.3]">
              rise
            </p>
            <p className="wordmark-dots -mt-[2.7cqw] w-fit text-[length:20.2cqw]">
              Classroom
            </p>
          </div>
          <p className="mt-4 font-work text-[14px] leading-5 tracking-[-0.01em] text-[#aab7b8] lg:absolute lg:top-[10.2cqw] lg:right-[1.2cqw] lg:mt-0">
            &copy; 2026 Rise Classroom. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
