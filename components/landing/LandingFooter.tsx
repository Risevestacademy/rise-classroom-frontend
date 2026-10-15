import Image from "next/image";

/** Sits behind the page and is revealed as the content above scrolls away. */
export function LandingFooter() {
  return (
    <footer className="sticky bottom-0 flex h-[904px] flex-col justify-end bg-brand-950 px-4 pb-[73px] lg:px-[95px]">
      <Image
        data-footer-wordmark
        src="/landing/footer-wordmark.png"
        alt="Rise Classroom"
        width={1250}
        height={300}
        className="h-auto w-full max-w-[1250px]"
      />
    </footer>
  );
}
