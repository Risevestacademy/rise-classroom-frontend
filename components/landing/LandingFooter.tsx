import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="flex h-[904px] flex-col justify-end bg-brand-950 px-4 pb-[73px] lg:px-[95px]">
      <Image
        src="/landing/footer-wordmark.png"
        alt="Rise Classroom"
        width={1250}
        height={300}
        className="h-auto w-full max-w-[1250px]"
      />
    </footer>
  );
}
