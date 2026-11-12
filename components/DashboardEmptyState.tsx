const cardPath =
  "M0 32C0 16.9151 0 9.37258 4.68629 4.68629C9.37258 0 16.9151 0 32 0H107C122.085 0 129.627 0 134.314 4.68629C139 9.37258 139 16.9151 139 32V42C139 57.0849 139 64.6274 134.314 69.3137C129.627 74 122.085 74 107 74H32C16.9151 74 9.37258 74 4.68629 69.3137C0 64.6274 0 57.0849 0 42V32Z";

const diamondPath =
  "M3.21799 10.282C1.60329 8.66729 0.795934 7.85993 0.752434 6.86183C0.749189 6.78731 0.749189 6.71267 0.752434 6.63815C0.795934 5.64005 1.60329 4.8327 3.21799 3.21799C4.8327 1.60329 5.64005 0.795934 6.63815 0.752434C6.71267 0.749189 6.78731 0.749189 6.86183 0.752434C7.85993 0.795934 8.66729 1.60329 10.282 3.21799C11.8967 4.8327 12.704 5.64005 12.7475 6.63815C12.7508 6.71267 12.7508 6.78731 12.7475 6.86183C12.704 7.85993 11.8967 8.66729 10.282 10.282C8.66729 11.8967 7.85993 12.704 6.86183 12.7475C6.78731 12.7508 6.71267 12.7508 6.63815 12.7475C5.64005 12.704 4.8327 11.8967 3.21799 10.282ZM4.3501 6.75042H9.15009M6.7471 4.35352V9.15353";

function Illustration() {
  return (
    <svg
      width="242"
      height="164"
      viewBox="0 0 242 164"
      fill="none"
      aria-hidden="true"
      className="max-w-full"
    >
      <defs>
        <filter
          id="dashboard-empty-shadow"
          x="-10%"
          y="-10%"
          width="120%"
          height="130%"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow dx="-2" dy="6" stdDeviation="2" floodOpacity="0.1" />
        </filter>
      </defs>

      <g transform="translate(74 28)">
        <path d={cardPath} fill="#EFEFEF" />
        <rect x="12" y="54" width="80" height="8" fill="#F1F4F4" />
        <rect x="12" y="42" width="45" height="8" fill="#D9D9D9" />
      </g>
      <g transform="translate(39 78)" filter="url(#dashboard-empty-shadow)">
        <path d={cardPath} fill="white" />
        <rect x="12" y="54" width="80" height="8" fill="#E8F5E9" />
        <rect x="12" y="42" width="45" height="8" fill="#D9D9D9" />
      </g>

      <circle cx="222" cy="137" r="5" fill="#D9D9D9" />
      <circle cx="5" cy="77" r="5" fill="#D9D9D9" />
      <circle cx="60" cy="36" r="4.23" stroke="#D9D9D9" strokeWidth="1.53" />
      <circle cx="186" cy="11" r="4.23" stroke="#D9D9D9" strokeWidth="1.53" />

      {[
        [10, 152],
        [111, 0],
        [230, 46],
      ].map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={diamondPath}
          transform={`translate(${x - 1} ${y - 1})`}
          stroke="#D9D9D9"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

/** Shown on the admin dashboard while the cohort has no activity. */
export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center px-4 pt-16 pb-16 lg:pt-[124px]">
      <div className="flex w-full max-w-[451px] flex-col items-center gap-3 text-center">
        <Illustration />
        <h2 className="text-[32px] leading-10 font-semibold text-text-primary">
          It&apos;s quiet for now
        </h2>
        <p className="text-lg leading-6 font-semibold text-text-secondary">
          Start by setting up your tracks and adding participants. As your
          program grows, you&apos;ll see engagement, progress, and important
          updates here.
        </p>
      </div>
    </div>
  );
}
