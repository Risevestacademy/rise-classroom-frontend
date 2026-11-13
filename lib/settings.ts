import { generalSettingGroups } from "@/lib/general-settings";
import { academyRoles } from "@/lib/role-permissions";
import { systemPreferenceGroups } from "@/lib/system-preferences";

/* The settings area's routes, navigation and search. Each page's own data
   lives beside it: general-settings, notification-settings,
   check-in-questions, role-permissions and system-preferences. */

export const settingsBasePath = "/admin/settings";

export const settingsRoutes = {
  general: `${settingsBasePath}/general`,
  appearance: `${settingsBasePath}/appearance`,
  learning: `${settingsBasePath}/learning-engagement`,
  addQuestion: `${settingsBasePath}/learning-engagement/questions/new`,
  editQuestions: `${settingsBasePath}/learning-engagement/questions/edit`,
  roles: `${settingsBasePath}/roles-permissions`,
  notifications: `${settingsBasePath}/notifications`,
  system: `${settingsBasePath}/system-preferences`,
} as const;

/* Appearance */

export type InterfaceTheme = "system" | "light" | "dark";

export type WorkspaceTheme = { id: string; name: string; color: string };

/* The design only settles the first two colours; the rest are placeholders. */
export const workspaceThemes: WorkspaceTheme[] = [
  { id: "navy", name: "Navy", color: "#080d38" },
  { id: "green", name: "Green", color: "#006400" },
  { id: "blue", name: "Blue", color: "#4169e1" },
  { id: "purple", name: "Purple", color: "#6d28d9" },
  { id: "teal", name: "Teal", color: "#0f766e" },
  { id: "red", name: "Red", color: "#b91c1c" },
];

/* Search */

export type SettingsSearchEntry = { label: string; section: string; href: string };

export const settingsNavItems = [
  { key: "general", title: "General", href: settingsRoutes.general },
  { key: "appearance", title: "Appearance", href: settingsRoutes.appearance },
  {
    key: "learning",
    title: "Learning & Engagement",
    href: settingsRoutes.learning,
  },
  { key: "roles", title: "Roles & Permission", href: settingsRoutes.roles },
  {
    key: "notifications",
    title: "Notifications",
    href: settingsRoutes.notifications,
  },
  { key: "system", title: "System Preferences", href: settingsRoutes.system },
] as const;

export const settingsSearchEntries: SettingsSearchEntry[] = [
  ...generalSettingGroups.flatMap((group) =>
    group.settings.map((setting) => ({
      label: setting.label,
      section: "General",
      href: settingsRoutes.general,
    })),
  ),
  ...["Interface theme", "Workspace theme", "Reduce motion"].map((label) => ({
    label,
    section: "Appearance",
    href: settingsRoutes.appearance,
  })),
  {
    label: "Weekly check-ins",
    section: "Learning & Engagement",
    href: settingsRoutes.learning,
  },
  {
    label: "Check-in questions",
    section: "Learning & Engagement",
    href: settingsRoutes.learning,
  },
  {
    label: "Add question",
    section: "Learning & Engagement",
    href: settingsRoutes.addQuestion,
  },
  ...academyRoles.map((role) => ({
    label: role.name,
    section: "Roles & Permission",
    href: `${settingsRoutes.roles}/${role.slug}`,
  })),
  ...[
    "Notification channels",
    "Notification events",
    "Recipient default",
  ].map((label) => ({
    label,
    section: "Notifications",
    href: settingsRoutes.notifications,
  })),
  ...systemPreferenceGroups.flatMap((group) =>
    group.pages.map((page) => ({
      label: page.title,
      section: "System Preferences",
      href: `${settingsRoutes.system}/${page.slug}`,
    })),
  ),
];

export function searchSettings(query: string): SettingsSearchEntry[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return settingsSearchEntries.filter((entry) =>
    `${entry.label} ${entry.section}`.toLowerCase().includes(term),
  );
}
