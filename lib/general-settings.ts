/* PENDING-BACKEND: the API has no settings endpoints yet, so these are the
   design's sample data and changes last until the page is reloaded. */

type Option<T extends string = string> = { value: T; label: string };

export type GeneralSettingKey =
  | "language"
  | "timeZone"
  | "dateFormat"
  | "timeFormat"
  | "startOfWeek"
  | "sessionTimeout"
  | "inactivityWarning";

export type GeneralSetting = {
  key: GeneralSettingKey;
  label: string;
  description: string;
  options: Option[];
};

export const generalSettingGroups: {
  title: string;
  settings: GeneralSetting[];
}[] = [
  {
    title: "Regional preferences",
    settings: [
      {
        key: "language",
        label: "Language",
        description: "Default language used across the platform",
        options: [
          { value: "en", label: "English" },
          { value: "fr", label: "French" },
        ],
      },
      {
        key: "timeZone",
        label: "Time zone",
        description: "Used for schedules, sessions and deadlines",
        options: [
          { value: "UTC", label: "UTC (GMT)" },
          { value: "UTC+1", label: "UTC+1 (WAT)" },
          { value: "UTC+2", label: "UTC+2 (CAT)" },
          { value: "UTC+3", label: "UTC+3 (EAT)" },
        ],
      },
      {
        key: "dateFormat",
        label: "Date format",
        description: "Choose how dates are displayed",
        options: [
          { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
          { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
          { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
        ],
      },
      {
        key: "timeFormat",
        label: "Time format",
        description: "Choose between 12-hour and 24 hour time",
        options: [
          { value: "12", label: "12-hour (e.g 2:00 PM)" },
          { value: "24", label: "24-hour (e.g 14:00)" },
        ],
      },
      {
        key: "startOfWeek",
        label: "Start of week",
        description: "Set the first day displayed in calenders",
        options: [
          { value: "monday", label: "Monday" },
          { value: "sunday", label: "Sunday" },
          { value: "saturday", label: "Saturday" },
        ],
      },
    ],
  },
  {
    title: "Platform defaults",
    settings: [
      {
        key: "sessionTimeout",
        label: "Session timeout",
        description: "Automatically log out inactive users",
        options: [
          { value: "15", label: "15 minutes" },
          { value: "30", label: "30 minutes" },
          { value: "60", label: "1 hour" },
          { value: "120", label: "2 hours" },
        ],
      },
      {
        key: "inactivityWarning",
        label: "Inactivity warning",
        description: "Warn users before their session expires",
        options: [
          { value: "1", label: "1 minute" },
          { value: "5", label: "5 minutes" },
          { value: "10", label: "10 minutes" },
        ],
      },
    ],
  },
];

export const defaultGeneralSettings: Record<GeneralSettingKey, string> = {
  language: "en",
  timeZone: "UTC+1",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12",
  startOfWeek: "monday",
  sessionTimeout: "30",
  inactivityWarning: "5",
};
