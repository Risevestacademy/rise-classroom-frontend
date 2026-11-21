"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/*
 * A Link that prefetches its route on hover or focus, not when it scrolls into
 * view. The landing page shows the sign-in, sign-up and privacy links on load,
 * and prefetching them then downloads their code while the page is still
 * starting up. Hover still gives the route a head start before the click.
 */
export function HoverPrefetchLink({
  href,
  onMouseEnter,
  onFocus,
  ...props
}: React.ComponentProps<typeof Link> & { href: string }) {
  const router = useRouter();
  /* Only real routes: "/#section" stays on this page and mailto: is not a route. */
  const prefetch = () => {
    if (href.startsWith("/") && !href.startsWith("/#")) router.prefetch(href);
  };

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={(event) => {
        prefetch();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        prefetch();
        onFocus?.(event);
      }}
      {...props}
    />
  );
}
