import type { ReactNode } from "react";

import { createIcon, withDefaults } from "./create-icon";
import {
  Calendar03,
  InformationCircle,
  Mail02,
  Search01,
  SquareLockPassword,
  Video,
} from "./generated";

export * from "./generated";
export { createIcon, withDefaults } from "./create-icon";
export type { IconComponent, IconProps, IconVariant } from "./create-icon";

// Legacy names kept so existing imports keep working (and their original default sizes).
export const InfoIcon = withDefaults(InformationCircle, { variant: "bulk", size: 16 }, "InfoIcon");
export const Mail2 = withDefaults(Mail02, { size: 20 }, "Mail2");
export const Calendar = withDefaults(Calendar03, { size: 20 }, "Calendar");
export const Search = withDefaults(Search01, { size: 20 }, "Search");
export const SquareLock = withDefaults(SquareLockPassword, { size: 20 }, "SquareLock");
export const Video02 = Video;

// Not in the Figma icon set yet.
export const BagPack = createIcon(
  "BagPack",
  {
    solid: (
      <path
        d="m3.75,19c0,.56.11,1.09.31,1.58-1.06-.38-1.81-1.39-1.81-2.58v-3c0-1.07.61-1.99,1.5-2.45v6.45Zm16.5-6.45v6.45c0,.56-.11,1.09-.31,1.58,1.06-.38,1.81-1.39,1.81-2.58v-3c0-1.07-.61-1.99-1.5-2.45ZM10,2.75h.23c-.32-.31-.75-.5-1.23-.5h-2c-.96,0-1.75.79-1.75,1.75v.94c1.14-1.34,2.85-2.19,4.75-2.19Zm7-.5h-2c-.48,0-.91.19-1.23.5h.23c1.9,0,3.61.85,4.75,2.19v-.94c0-.96-.79-1.75-1.75-1.75Zm-7.75,8v-.25c0-.41.34-.75.75-.75s.75.34.75.75v.25h2.5v-.25c0-.41.34-.75.75-.75s.75.34.75.75v.25h.25c1.57,0,2.92-.86,3.66-2.13-.41-2.2-2.34-3.87-4.66-3.87h-4c-2.62,0-4.75,2.13-4.75,4.75v.21c.74.64,1.7,1.04,2.75,1.04h1.25Zm3.75,7.5h-2c-.689,0-1.25.561-1.25,1.25v2.75h4.5v-2.75c0-.689-.561-1.25-1.25-1.25Zm1.75-6v.25c0,.41-.34.75-.75.75s-.75-.34-.75-.75v-.25h-2.5v.25c0,.41-.34.75-.75.75s-.75-.34-.75-.75v-.25h-1.25c-1,0-1.93-.25-2.75-.7v7.95c0,1.52,1.23,2.75,2.75,2.75h.25v-2.75c0-1.517,1.233-2.75,2.75-2.75h2c1.517,0,2.75,1.233,2.75,2.75v2.75h.25c1.52,0,2.75-1.23,2.75-2.75v-8.65c-1.01.87-2.32,1.4-3.75,1.4h-.25Z"
        fill="currentColor"
      />
    ),
  },
  "solid",
);

export const Progress = createIcon(
  "Progress",
  {
    stroke: (
      <>
        <path d="M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 6C13.053 6 14.088 6.277 15 6.804C15.912 7.33 16.67 8.088 17.196 9C17.723 9.912 18 10.947 18 12C18 13.053 17.723 14.088 17.196 15C16.67 15.912 15.912 16.67 15 17.196C14.088 17.723 13.053 18 12 18C10.947 18 9.912 17.723 9 17.196C8.088 16.67 7.331 15.912 6.804 15L12 12V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  "stroke",
);

export const Time04 = createIcon(
  "Time04",
  {
    stroke: (
      <>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9.5 9.5L13 13M16 8L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  "stroke",
);

export const UserQuestion = createIcon(
  "UserQuestion",
  {
    stroke: (
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="8" r="4" />
        <path d="M3 20.5c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
        <path d="M17 5.5a2.25 2.25 0 1 1 3.3 2c-.7.38-1.05.85-1.05 1.6" />
        <path d="M19.25 12h.01" />
      </g>
    ),
    solid: (
      <>
        <circle cx="10" cy="8" r="4.75" fill="currentColor" />
        <path d="M2.25 20.5c0-4 3.45-7.25 7.75-7.25s7.75 3.25 7.75 7.25c0 .41-.34.75-.75.75H3a.75.75 0 0 1-.75-.75Z" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 5.5a2.25 2.25 0 1 1 3.3 2c-.7.38-1.05.85-1.05 1.6" />
          <path d="M19.25 12h.01" />
        </g>
      </>
    ),
  },
  "stroke",
);

export const Mortarboard = createIcon(
  "Mortarboard",
  {
    stroke: (
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4.5 2.5 9.5l9.5 5 9.5-5-9.5-5Z" />
        <path d="M6.5 11.75v4.5c0 1.5 2.5 3.25 5.5 3.25s5.5-1.75 5.5-3.25v-4.5" />
        <path d="M21.5 9.5V15" />
      </g>
    ),
    solid: (
      <>
        <path d="M11.65 3.84a.75.75 0 0 1 .7 0l9.5 5a.75.75 0 0 1 0 1.32l-9.5 5a.75.75 0 0 1-.7 0l-9.5-5a.75.75 0 0 1 0-1.32l9.5-5Z" fill="currentColor" />
        <path d="M5.75 13.4v2.85c0 2.1 3 4 6.25 4s6.25-1.9 6.25-4V13.4l-5.2 2.74a2.25 2.25 0 0 1-2.1 0L5.75 13.4Z" fill="currentColor" />
        <path d="M21.5 9.5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  "stroke",
);

export const UserChat = createIcon(
  "UserChat",
  {
    stroke: (
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="10.5" r="3.5" />
        <path d="M2.5 20.5c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
        <path d="M17.5 2.75a3.75 3.75 0 1 1-1.9 6.98l-1.85.52.52-1.85a3.75 3.75 0 0 1 3.23-5.65Z" />
        <path d="M16 6.5h.01M17.5 6.5h.01M19 6.5h.01" />
      </g>
    ),
    solid: (
      <>
        <circle cx="9" cy="10.5" r="4.25" fill="currentColor" />
        <path d="M1.75 20.5c0-3.8 3.3-6.25 7.25-6.25s7.25 2.45 7.25 6.25c0 .41-.34.75-.75.75h-13a.75.75 0 0 1-.75-.75Z" fill="currentColor" />
        <path d="M17.5 2a4.5 4.5 0 1 1-2.05 8.5l-2.3.65.65-2.3A4.5 4.5 0 0 1 17.5 2Z" fill="currentColor" />
        <path d="M16 6.5h.01M17.5 6.5h.01M19 6.5h.01" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  "stroke",
);

// The announcement form's icons, drawn on 16px and 20px grids in Figma.
export const Image01 = createIcon(
  "Image01",
  {
    stroke: (
      <g transform="scale(1.5)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="5" r="1" />
        <path d="M1.66 8c0-2.99 0-4.48.93-5.41.93-.93 2.42-.93 5.41-.93 2.99 0 4.48 0 5.41.93.93.93.93 2.42.93 5.41 0 2.99 0 4.48-.93 5.41-.93.93-2.42.93-5.41.93-2.99 0-4.48 0-5.41-.93C1.66 12.48 1.66 10.99 1.66 8Z" />
        <path d="M3.34 14c2.91-3.48 6.18-8.08 11-4.97" />
      </g>
    ),
  },
  "stroke",
);

export const Rows = createIcon(
  "Rows",
  {
    stroke: (
      <g transform="scale(1.5)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.66 10.33h12.67M1.66 5.67h12.67" />
        <path d="M1.66 8c0-2.99 0-4.48.93-5.41.93-.93 2.42-.93 5.41-.93 2.99 0 4.48 0 5.41.93.93.93.93 2.42.93 5.41 0 2.99 0 4.48-.93 5.41-.93.93-2.42.93-5.41.93-2.99 0-4.48 0-5.41-.93C1.66 12.48 1.66 10.99 1.66 8Z" />
      </g>
    ),
  },
  "stroke",
);

export const Tie = createIcon(
  "Tie",
  {
    stroke: (
      <g transform="scale(1.2)" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round">
        <path d="M10 6.67c.31 0 .7-.09 1.05-.19.36-.1.54-.15.73-.31.19-.15.3-.35.52-.74l.43-.76c.47-.83.7-1.24.56-1.61-.14-.38-.58-.53-1.46-.84l-.75-.27c-.54-.19-.81-.29-1.09-.29s-.55.1-1.09.29l-.75.27c-.88.31-1.32.46-1.46.84-.14.37.1.78.56 1.61l.43.76c.22.39.33.59.52.74.19.16.37.21.73.31.34.1.73.19 1.05.19Z" />
        <path d="M8.4 6.67 7.01 12.62c-.3 1.29-.45 1.94-.28 2.54.18.61.65 1.07 1.6 1.99.78.76 1.17 1.14 1.65 1.15h.03c.48-.01.87-.39 1.64-1.15.94-.92 1.41-1.38 1.59-1.99.18-.6.03-1.25-.27-2.54L11.6 6.67" />
      </g>
    ),
  },
  "stroke",
);

// From the live session screens; not in the Figma icon set yet.
const liveIcon = (name: string, scale: number, body: ReactNode) =>
  createIcon(
    name,
    {
      stroke: (
        <g transform={`scale(${scale})`} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          {body}
        </g>
      ),
    },
    "stroke",
  );

export const MicOff02 = liveIcon(
  "MicOff02",
  1.2,
  <g strokeWidth="1.5">
    <path d="M10 15v3.33M10 15h-.4a5.83 5.83 0 0 1-5.43-5M10 15h.4a5.8 5.8 0 0 0 3.41-1.2M10 18.33h2.5m-2.5 0H7.5M15.83 10a5.8 5.8 0 0 1-.54 1.96" />
    <path d="M6.96 3.63A3.33 3.33 0 0 1 13.33 5v4.17q0 .39-.08.75M6.67 6.67v2.5a3.33 3.33 0 0 0 5.24 2.74" />
    <path d="m1.67 1.67 16.66 16.66" />
  </g>,
);

export const VideoOff = liveIcon(
  "VideoOff",
  1,
  <g strokeWidth="1.5">
    <path d="M3.67 11.17c0-2.75 0-4.13.85-4.98.86-.86 2.23-.86 4.98-.86h.83c2.75 0 4.13 0 4.98.86.86.85.86 2.23.86 4.98v1.66c0 2.75 0 4.13-.86 4.98-.85.86-2.23.86-4.98.86H9.5c-2.75 0-4.12 0-4.98-.86-.85-.85-.85-2.23-.85-4.98z" />
    <path d="m16.17 9.42.1-.08c1.77-1.46 2.65-2.19 3.36-1.84.7.36.7 1.52.7 3.85v1.3c0 2.33 0 3.49-.7 3.85-.71.35-1.59-.38-3.36-1.83l-.1-.09" />
    <path d="m2.5 2.5 19 19" />
  </g>,
);

export const ComputerScreenShare = liveIcon(
  "ComputerScreenShare",
  1.2,
  <g strokeWidth="1.5">
    <path d="M11.67 17.5h1.66m-1.66 0a1.25 1.25 0 0 1-1.25-1.25v-2.08H10m1.67 3.33H10m0-3.33h-.42v2.08c0 .69-.56 1.25-1.25 1.25M10 14.17v3.33m0 0H8.33m0 0H6.67" />
    <path d="M13.33 2.5H6.67c-2.36 0-3.54 0-4.27.73-.73.74-.73 1.91-.73 4.27v1.67c0 2.36 0 3.53.73 4.27.73.73 1.91.73 4.27.73h6.66c2.36 0 3.54 0 4.27-.73.73-.74.73-1.91.73-4.27V7.5c0-2.36 0-3.53-.73-4.27-.73-.73-1.91-.73-4.27-.73" />
    <path d="M11.25 10s2.08-1.53 2.08-2.08-2.08-2.09-2.08-2.09m1.67 2.09h-2.5c-1.17 0-1.76 0-2.18.28a1.7 1.7 0 0 0-.46.46c-.28.42-.28 1-.28 2.17" />
  </g>,
);

export const Smile = liveIcon(
  "Smile",
  1.2,
  <g strokeWidth="1.5">
    <path d="M18.33 10a8.33 8.33 0 1 1-16.66 0 8.33 8.33 0 0 1 16.66 0" />
    <path d="M6.67 12.5A4.16 4.16 0 0 0 10 14.17c1.36 0 2.57-.66 3.33-1.67" />
    <path d="M13.02 6.99v.44m-6.04-.44v.44m.31-.14c0-.35-.14-.62-.31-.62s-.31.27-.31.62.14.62.31.62.31-.28.31-.62m6.04 0c0-.35-.14-.62-.31-.62s-.31.27-.31.62.14.62.31.62.31-.28.31-.62" />
  </g>,
);

export const WavingHand02 = liveIcon(
  "WavingHand02",
  1.2,
  <g strokeWidth="1.5">
    <path d="m15.76 9.75-1.28 3.44c-.6 1.6-.9 2.41-1.39 2.96a4 4 0 0 1-2.96 1.35c-.75.01-1.57-.28-3.2-.86-.86-.3-1.3-.46-1.66-.69a3.6 3.6 0 0 1-1.35-1.39c-.21-.37-.35-.8-.61-1.66L2.14 9.13a1.2 1.2 0 0 1 .6-1.52c.69-.41 1.6-.14 1.94.57l.78 1.64 2.19-5.87a1.2 1.2 0 0 1 1.55-.7c.62.22.95.9.72 1.5m0 0 .55-1.47a1.2 1.2 0 0 1 1.55-.7c.62.22.95.9.72 1.5l-.55 1.48m-2.27-.8-1.24 3.32m2.27.8 1.24-3.32a1.2 1.2 0 0 1 1.55-.7c.62.22.95.9.72 1.5l-.55 1.48m-.69 1.85.69-1.85a1.2 1.2 0 0 1 1.55-.7c.62.22.95.9.72 1.5l-.69 1.85" />
    <path d="M17.78 11.67c.45 1.36-.23 2.85-1.53 3.33" />
  </g>,
);

export const AudioLines = liveIcon(
  "AudioLines",
  2,
  <path strokeWidth="0.75" d="M6 1.5v9M4 3.5v5M2 5.5v1M8 3.5v5M10 5.5v1" />,
);

export const CallEnd = liveIcon(
  "CallEnd",
  1,
  <path strokeWidth="1.56" d="M15.67 9.25v3.67l4.58.91V10.17c-4.58-4.59-11.92-4.59-16.5 0v3.66l4.58-.91V9.25" />,
);
