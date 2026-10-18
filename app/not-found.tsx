import { HomeButton } from "@/components/not-found/HomeButton";
import { NotFoundMotion } from "@/components/not-found/NotFoundMotion";

// Top-left corners of the decorative squares in the 1440×1024 design frame.
const squares = [
  [969, 166], [969, 188], [949, 210], [949, 232], [929, 254],
  [520, 264], [500, 286], [520, 308], [520, 330],
  [1382, 366], [1361, 387], [1340, 408],
  [375, 393], [334, 432],
  [1184, 527], [1079, 622],
  [318, 604], [318, 626], [340, 626], [360, 690],
  [665, 658], [665, 680], [756, 668],
  [899, 723], [899, 745], [919, 767], [899, 789],
  [308, 733], [308, 755], [286, 777], [308, 777], [286, 799],
  [505, 776], [527, 776], [505, 798],
];

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 pt-1">
      <NotFoundMotion />

      {/* Placed from the centre so the pattern stays around the text at any
          width; hidden on small screens, where it would sit on the text. */}
      <div
        aria-hidden
        data-intro
        className="pointer-events-none absolute inset-0 hidden md:block"
      >
        {squares.map(([x, y]) => (
          <span
            key={`${x}-${y}`}
            data-nf-square
            className="absolute size-5 bg-brand-200"
            style={{
              left: `calc(50% + ${x - 720}px)`,
              top: `calc(50% + ${y - 512}px)`,
            }}
          />
        ))}
      </div>

      <div data-intro className="relative flex flex-col items-center text-center">
        <p
          data-nf-code
          className="text-[96px] leading-none font-semibold text-brand-400"
        >
          404
        </p>
        <h1
          data-nf="title"
          className="mt-5 text-[32px] leading-10 font-semibold text-black"
        >
          Page not found
        </h1>
        <p
          data-nf="sub"
          className="mt-3 font-work text-xl leading-7 tracking-[-0.0125em] text-text-secondary"
        >
          The page you are looking for doesn&rsquo;t exist or has been moved
        </p>
        <div data-nf="cta" data-magnetic className="mt-7">
          <HomeButton />
        </div>
      </div>
    </main>
  );
}
