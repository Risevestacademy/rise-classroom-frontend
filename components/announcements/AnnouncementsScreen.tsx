"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";

import {
  ArrowDown01,
  Calendar03,
  Marketing,
  Study,
  Time04,
  Track,
  UserMultiple,
} from "@/assets/icons";
import { CreateAnnouncementDialog } from "@/components/announcements/CreateAnnouncementDialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectInput } from "@/components/ui/select";
import { adminQueries } from "@/lib/admin";
import {
  audienceLabel,
  audienceRoles,
  categoryLabel,
  dateRanges,
  inDateRange,
  initialAdminAnnouncements,
  matchesAudience,
  publishedLabel,
  useSampleAdminAnnouncements,
  type AdminAnnouncement,
  type AnnouncementCategory,
  type AudienceFilter,
  type DateRange,
} from "@/lib/announcements";
import { useTabParam } from "@/lib/use-tab-param";
import { cn } from "@/lib/utils";

type Icon = React.ComponentType<{ className?: string }>;

const categoryIcons: Record<AnnouncementCategory, Icon> = {
  GENERAL: Track,
  ACADEMIC_UPDATE: Study,
  EVENT: Calendar03,
  DEADLINE: Time04,
};

const tabs = [
  { value: "all", label: "All announcements", icon: Track },
  { value: "general", label: "General", icon: Marketing, category: "GENERAL" },
  { value: "academic", label: "Academic update", icon: Study, category: "ACADEMIC_UPDATE" },
  { value: "events", label: "Events", icon: Calendar03, category: "EVENT" },
  { value: "deadlines", label: "Deadlines", icon: Time04, category: "DEADLINE" },
] as const;

const chevron = <ArrowDown01 className="size-4" />;

/** The admin Announcements page: categories, the list and its filters. */
export function AnnouncementsScreen() {
  const [tab, setTab] = useTabParam(tabs);
  const [announcements, setAnnouncements] = React.useState(
    initialAdminAnnouncements,
  );
  const [audience, setAudience] = React.useState<AudienceFilter>("all");
  const [range, setRange] = React.useState<DateRange>("all");
  const tracksQuery = useQuery(adminQueries.tracks("ACTIVE"));

  const category = tabs.find((item) => item.value === tab);
  const visible = announcements.filter(
    (item) =>
      (!category || !("category" in category) || item.category === category.category) &&
      matchesAudience(item.audience, audience) &&
      inDateRange(item.publishedAt, range),
  );
  const filtered = tab !== "all" || audience !== "all" || range !== "all";

  const audienceOptions: { value: AudienceFilter; label: string }[] = [
    { value: "all", label: "All audiences" },
    { value: "EVERYONE", label: "Everyone" },
    ...audienceRoles.map((role) => ({ value: role.value, label: role.label })),
    ...(tracksQuery.data ?? []).map((track) => ({
      value: `track:${track.name}` as const,
      label: `${track.name} track`,
    })),
  ];

  return (
    <main className="min-w-0 flex-1 px-4 pt-6 pb-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Share updates with your academy and review what has been sent.
          </p>
        </div>
        <CreateAnnouncementDialog
          onPublish={(announcement) => {
            if (useSampleAdminAnnouncements) {
              setAnnouncements((list) => [announcement, ...list]);
            }
          }}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:mt-10 lg:grid-cols-[236px_minmax(0,1fr)] lg:gap-x-10 xl:grid-cols-[236px_minmax(0,1fr)_254px] xl:gap-x-6">
        <nav
          aria-label="Announcement categories"
          className="-mx-4 flex gap-1 self-start overflow-x-auto px-4 lg:row-span-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
        >
          {tabs.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-current={tab === value ? "page" : undefined}
              onClick={() => setTab(value)}
              className={cn(
                "flex h-11 shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap text-text-primary transition-colors hover:bg-surface-subtle",
                tab === value && "bg-surface-subtle",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <section
          aria-label="Filters"
          className="flex flex-col gap-6 self-start rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgb(0_0_0/0.15)] lg:col-start-2 xl:col-start-3 xl:row-start-1"
        >
          <h2 className="text-xl font-semibold text-text-primary">Filters</h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <FilterField label="Audience" id="announcement-audience-filter">
              <SelectInput
                id="announcement-audience-filter"
                value={audience}
                onChange={setAudience}
                options={audienceOptions}
                className="h-9 px-2.5"
                chevron={chevron}
              />
            </FilterField>
            <FilterField label="Date range" id="announcement-date-filter">
              <SelectInput
                id="announcement-date-filter"
                value={range}
                onChange={setRange}
                options={dateRanges.map(({ value, label }) => ({ value, label }))}
                leadingIcon={<Calendar03 />}
                className="h-9 px-2.5"
                chevron={chevron}
              />
            </FilterField>
          </div>
        </section>

        <div className="min-w-0 lg:col-start-2 xl:row-start-1 xl:ml-4">
          {visible.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {visible.map((announcement) => (
                <li key={announcement.id}>
                  <AnnouncementCard announcement={announcement} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgb(0_0_0/0.15)]">
              <EmptyState
                icon={Megaphone}
                tone="brand"
                title={
                  filtered
                    ? "No announcements match"
                    : "No announcements yet"
                }
                description={
                  filtered
                    ? "Try another category, audience or date range."
                    : "Announcements you publish to your academy will show here."
                }
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function FilterField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="py-0.5 text-sm font-medium text-text-primary"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function AnnouncementCard({ announcement }: { announcement: AdminAnnouncement }) {
  const Icon = categoryIcons[announcement.category];

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgb(0_0_0/0.15)]">
      <div className="flex flex-col gap-3 border-b border-border-default pb-4">
        <Badge variant="light" status="info" size="lg">
          <Icon />
          {categoryLabel(announcement.category)}
        </Badge>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg/6 font-semibold text-text-primary">
            {announcement.title}
          </h2>
          <p className="text-[13px]/4.5 whitespace-pre-line text-text-primary">
            {announcement.content}
          </p>
        </div>
      </div>

      <dl className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex items-center gap-2.5">
          <dt className="flex items-center gap-2 text-[13px]/4.5 text-text-secondary">
            <UserMultiple className="size-4" />
            Audience:
          </dt>
          <dd className="text-sm font-medium text-text-primary">
            {audienceLabel(announcement.audience)}
          </dd>
        </div>
        <div className="flex items-center gap-2.5">
          <dt className="flex items-center gap-2 text-[13px]/4.5 text-text-secondary">
            <Calendar03 className="size-4" />
            Published:
          </dt>
          <dd className="text-sm font-medium text-text-primary">
            {publishedLabel(announcement.publishedAt)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
