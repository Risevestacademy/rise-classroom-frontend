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
