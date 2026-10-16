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

/** Sits behind the page and is revealed as the content above scrolls away. */
export function LandingFooter() {
  return (
    <footer className="sticky bottom-0 flex flex-col justify-between gap-16 bg-brand-950 px-4 pt-10 pb-10 lg:h-[628px] lg:gap-0 lg:px-[96px] lg:pt-[60px] lg:pb-[38px]">
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

      <div className="relative">
        {/* Type sizes are in cqw so "Classroom" always spans the full width. */}
        <div
          data-footer-wordmark
          className="@container w-full max-w-[1250px] leading-none font-normal select-none"
        >
          <span className="sr-only">Rise Classroom</span>
          <p aria-hidden className="wordmark-dots w-fit text-[length:7.9cqw]">
            rise
          </p>
          <p
            aria-hidden
            className="wordmark-dots -mt-[1.5cqw] w-fit text-[length:20.1cqw]"
          >
            Classroom
          </p>
        </div>
        <p className="mt-4 font-work text-[14px] leading-5 tracking-[-0.01em] text-[#aab7b8] lg:absolute lg:top-[38%] lg:right-0 lg:mt-0">
          &copy; 2026 Rise Classroom. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
