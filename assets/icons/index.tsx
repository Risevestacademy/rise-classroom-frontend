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
