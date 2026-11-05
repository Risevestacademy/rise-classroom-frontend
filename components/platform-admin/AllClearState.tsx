export function AllClearState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <AllClearIllustration />
      <p className="mt-2 text-2xl leading-8 font-semibold text-text-primary">
        You&apos;re Good!
      </p>
      <p className="max-w-[360px] font-work text-base text-text-secondary">
        Once you start receiving applications and setups, you&apos;ll see
        activity, requests and key updates here.
      </p>
    </div>
  );
}

function AllClearIllustration() {
  return (
    <svg
      aria-hidden
      width="200"
      height="140"
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="30" cy="62" r="3.5" className="fill-neutral-300" />
      <circle cx="58" cy="30" r="3.5" className="stroke-neutral-300" />
      <circle cx="96" cy="10" r="4" className="stroke-neutral-300" />
      <circle cx="96" cy="10" r="1.5" className="fill-neutral-300" />
      <circle cx="132" cy="16" r="3.5" className="stroke-neutral-300" />
      <circle cx="172" cy="46" r="4" className="stroke-neutral-300" />
      <circle cx="172" cy="46" r="1.5" className="fill-neutral-300" />
      <circle cx="154" cy="112" r="3.5" className="fill-neutral-300" />
      <circle cx="42" cy="126" r="4" className="stroke-neutral-300" />
      <circle cx="42" cy="126" r="1.5" className="fill-neutral-300" />

      <rect x="70" y="24" width="82" height="62" rx="10" className="fill-neutral-200" />
      <rect x="84" y="56" width="34" height="9" rx="2" className="fill-neutral-300" />

      <g style={{ filter: "drop-shadow(0 6px 10px rgb(0 0 0 / 0.1))" }}>
        <rect x="48" y="62" width="82" height="62" rx="10" fill="white" />
      </g>
      <rect x="60" y="86" width="26" height="7" rx="2" className="fill-neutral-300" />
      <rect x="60" y="100" width="50" height="6" rx="2" className="fill-surface-success-badge" />
    </svg>
  );
}
