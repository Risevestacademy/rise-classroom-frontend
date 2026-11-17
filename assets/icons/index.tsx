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
