"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Add01, ArrowDown01 } from "@/assets/icons";
import { useCalendarArea } from "@/components/calendar/CalendarArea";
import {
  CalendarDialogActions,
  CalendarDialogHeader,
} from "@/components/calendar/CalendarDialog";
import {
  DateTimeRow,
  DescriptionField,
  GuestsField,
  KindToggle,
  labelClass,
  minutesOf,
  RepeatField,
  times,
  TitleField,
} from "@/components/calendar/EventFields";
import { blankDraft } from "@/components/calendar/EventFormDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SelectInput } from "@/components/ui/select";
import { SuccessToast } from "@/components/ui/toast";
import { adminQueries } from "@/lib/admin";
import {
  addDays,
  fromDateKey,
  toDateKey,
  toRrule,
  type CalendarEvent,
  type EventGuest,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";
import {
  addInvitees,
  createLiveSession,
  createLiveSessionSeries,
  DEFAULT_TIME_ZONE,
  liveSessionKeys,
  liveSessionQueries,
  removeInvitee,
  updateLiveSession,
  zonedTimeToIso,
  type LiveSession,
  type CreateLiveSessionInput,
  type LiveSessionType,
  type UpdateLiveSessionInput,
} from "@/lib/live-sessions";
import { mentorQueries, myMenteesQuery } from "@/lib/mentors";
import { sessionQuery } from "@/lib/session-query";

/** What the event form hands over when someone switches to a live session. */
export type LiveSessionBasics = Pick<
  CalendarEvent,
  | "title"
  | "date"
  | "endDate"
  | "startTime"
  | "endTime"
  | "repeat"
  | "description"
  | "guests"
>;

type Audience = "cohortId" | "trackId" | "mentorId" | "mentee" | "invitees";

/** Who each type is for, and what the API needs to know to invite them. */
const sessionTypes: Record<
  LiveSessionType,
  { label: string; hint: string; needs: Audience[] }
> = {
  TOWNHALL: {
    label: "Town hall",
    hint: "Everyone in a cohort is invited.",
    needs: ["cohortId"],
  },
  TRACK_MEETING: {
    label: "Track meeting",
    hint: "Everyone in one track of a cohort is invited.",
    needs: ["cohortId", "trackId"],
  },
  MENTORSHIP_GROUP: {
    label: "Mentorship group",
    hint: "A mentor and their students in one cohort.",
    needs: ["cohortId", "mentorId"],
  },
  MENTORSHIP_PAIR: {
    label: "One-on-one mentorship",
    hint: "A mentor and one of their students.",
    needs: ["mentorId", "mentee"],
  },
  EXPLICIT_INVITE: {
    label: "Invite only",
    hint: "Only the people you add as guests are invited.",
    needs: ["invitees"],
  },
};

const typeOptions = (types: LiveSessionType[]) =>
  types.map((type) => ({ value: type, label: sessionTypes[type].label }));

const allTypes = Object.keys(sessionTypes) as LiveSessionType[];

/** Mentors can only schedule mentorship sessions, hosted by themselves. */
const mentorTypes: LiveSessionType[] = ["MENTORSHIP_PAIR", "MENTORSHIP_GROUP"];

const DESCRIPTION_LIMIT = 5000;

/** The host field's value when whoever schedules it hosts it. */
const ME = "me";

const selectClass = "h-9 gap-2 pr-3.5 pl-3 font-work text-sm text-text-primary";

type Draft = LiveSessionBasics & {
  type: LiveSessionType;
  cohortId: string;
  trackId: string;
  mentorId: string;
  /** The chosen mentee's mentorship. */
  mentorshipId: string;
  hostId: string;
};

/**
 * Schedules a live session through the API, from the calendar's create
 * dialog (with the Event / Task / Live session switch) or on its own.
 */
export function LiveSessionForm({
  initial,
  hasEvents,
  onCreated,
  onKind,
}: {
  initial: LiveSessionBasics;
  hasEvents: (date: Date) => boolean;
  onCreated: (title: string) => void;
  /** Shows the type switch; picking Event or Task goes back to the event form. */
  onKind?: (kind: "event" | "task", basics: LiveSessionBasics) => void;
}) {
  const queryClient = useQueryClient();
  const asMentor = useCalendarArea() === "mentor";
  const me = useQuery({ ...sessionQuery(), enabled: asMentor }).data?.user;
  const [draft, setDraft] = React.useState<Draft>({
    title: initial.title,
    date: initial.date,
    endDate: initial.endDate,
    startTime: initial.startTime,
    endTime: initial.endTime,
    repeat: initial.repeat,
    description: initial.description,
    guests: initial.guests,
    type: asMentor ? "MENTORSHIP_PAIR" : "TRACK_MEETING",
    cohortId: "",
    trackId: "",
    mentorId: "",
    mentorshipId: "",
    hostId: ME,
  });
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const needs = sessionTypes[draft.type].needs;
  const mentored = needs.includes("mentorId");

  // The admin lists are closed to mentors, who pick from their own mentees.
  const cohorts = useQuery({
    ...adminQueries.cohorts(),
    enabled: !asMentor && needs.includes("cohortId"),
  });
  const tracks = useQuery({
    ...adminQueries.tracks("ACTIVE"),
    enabled: !asMentor && needs.includes("trackId"),
  });
  // A mentorship group is for one cohort, so only its mentors are offered.
  const groupCohort =
    draft.type === "MENTORSHIP_GROUP" ? draft.cohortId || undefined : undefined;
  const mentors = useQuery({
    ...mentorQueries.list(groupCohort),
    enabled: !asMentor && mentored,
  });
  const mentees = useQuery({
    ...mentorQueries.mentees(draft.mentorId),
    enabled: !asMentor && needs.includes("mentee") && draft.mentorId !== "",
  });
  const myMentees = useQuery({ ...myMenteesQuery(), enabled: asMentor });
  const instructors = useQuery({
    ...adminQueries.users({
      role: "INSTRUCTOR",
      cohortId: draft.cohortId || undefined,
      trackId: draft.trackId || undefined,
      limit: 100,
    }),
    enabled: !asMentor && !mentored,
  });

  const menteeQuery = asMentor ? myMentees : mentees;
  const menteeOptions = asMentor
    ? (myMentees.data ?? []).map((m) => ({
        mentorshipId: m.id,
        studentProfileId: m.student.id,
        name: m.student.user.name || m.student.user.email,
      }))
    : (mentees.data ?? []).map((m) => ({
        mentorshipId: m.mentorshipId,
        studentProfileId: m.studentProfileId,
        name: m.user.name || m.user.email,
      }));
  const cohortOptions = asMentor
    ? [
        ...new Map(
          (myMentees.data ?? []).map((m) => [
            m.student.cohort.id,
            { value: m.student.cohort.id, label: m.student.cohort.name },
          ]),
        ).values(),
      ]
    : (cohorts.data ?? []).map((cohort) => ({
        value: cohort.id,
        label: cohort.name,
      }));

  // A mentor always schedules their own sessions, and one whose students are
  // all in one cohort doesn't need to pick it.
  const mentorId = asMentor ? (me?.id ?? "") : draft.mentorId;
  const cohortId =
    draft.cohortId ||
    (asMentor && cohortOptions.length === 1 ? cohortOptions[0].value : "");
  const mentee = menteeOptions.find(
    (m) => m.mentorshipId === draft.mentorshipId,
  );
  const mentor = mentors.data?.find((m) => m.id === draft.mentorId);

  const start = fromDateKey(draft.date);
  const end = fromDateKey(draft.endDate);
  const startsAt = zonedTimeToIso(
    draft.date,
    draft.startTime,
    DEFAULT_TIME_ZONE,
  );
  const endsAt = zonedTimeToIso(
    draft.endDate,
    draft.endTime,
    DEFAULT_TIME_ZONE,
  );
  const duration = Math.round(
    (Date.parse(endsAt) - Date.parse(startsAt)) / 60_000,
  );

  const [now] = React.useState(() => Date.now());
  const timeProblem =
    Date.parse(startsAt) <= now
      ? "Pick a start time that hasn't passed yet."
      : duration <= 0
        ? "The session has to end after it starts."
        : draft.repeat && duration > 1440
          ? "A repeating session can't run longer than a day."
          : null;
  const audienceMissing =
    (needs.includes("cohortId") && !cohortId) ||
    (needs.includes("trackId") && !draft.trackId) ||
    (needs.includes("mentorId") && !mentorId) ||
    (needs.includes("mentee") && !mentee) ||
    (needs.includes("invitees") && draft.guests.length === 0);
  const canSubmit =
    draft.title.trim().length > 0 && !timeProblem && !audienceMissing;

  const create = useMutation({
    mutationFn: () => {
      const hostId = mentored
        ? mentorId
        : draft.hostId === ME
          ? undefined
          : draft.hostId;
      const input: Omit<CreateLiveSessionInput, "scheduledEndAt"> = {
        type: draft.type,
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        hostId,
        scheduledStartAt: startsAt,
        timezone: DEFAULT_TIME_ZONE,
        // The API turns away fields that don't belong to the type.
        ...(needs.includes("cohortId") && { cohortId }),
        ...(needs.includes("trackId") && { trackId: draft.trackId }),
        ...(needs.includes("mentorId") && { mentorId }),
        ...(mentee && {
          mentorshipId: mentee.mentorshipId,
          studentProfileId: mentee.studentProfileId,
        }),
      };
      const inviteeIds = needs.includes("invitees")
        ? draft.guests.map((guest) => guest.id)
        : undefined;

      if (!draft.repeat) {
        return createLiveSession({
          ...input,
          inviteeIds,
          scheduledEndAt: endsAt,
        });
      }
      const { ends } = draft.repeat;
      return createLiveSessionSeries({
        ...input,
        inviteeIds: inviteeIds ?? [],
        rrule: toRrule(draft.repeat, start),
        defaultDurationMinutes: duration,
        endsOn:
          ends.type === "on"
            ? zonedTimeToIso(ends.date, "23:59", DEFAULT_TIME_ZONE)
            : undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: liveSessionKeys.all });
      onCreated(draft.title.trim());
    },
  });

  // Moving the start keeps the session's length, like the event form.
  const setStartDate = (date: Date) => {
    const length = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    setDraft((d) => ({
      ...d,
      date: toDateKey(date),
      endDate: toDateKey(addDays(date, Math.max(0, length))),
    }));
  };
  const setStartTime = (time: string) => {
    const length = minutesOf(draft.endTime) - minutesOf(draft.startTime);
    const endMinutes = Math.min(
      minutesOf(time) + Math.max(0, length),
      23 * 60 + 45,
    );
    setDraft((d) => ({
      ...d,
      startTime: time,
      endTime: times[endMinutes / 15],
    }));
  };

  const basics = (): LiveSessionBasics => ({
    title: draft.title,
    date: draft.date,
    endDate: draft.endDate,
    startTime: draft.startTime,
    endTime: draft.endTime,
    repeat: draft.repeat,
    description: draft.description,
    guests: draft.guests,
  });

  const hostOptions = [
    { value: ME, label: "You" },
    ...(instructors.data?.items ?? []).map((user) => ({
      value: user.id,
      label: user.name || user.email,
    })),
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit && !create.isPending) create.mutate();
      }}
    >
      <CalendarDialogHeader title="Schedule live session" />

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,436px)_1px_minmax(0,272px)]">
        <div className="flex min-w-0 flex-col">
          <TitleField
            value={draft.title}
            onChange={(title) => set("title", title)}
          />

          {onKind && (
            <KindToggle
              value="live"
              kinds={["event", "task", "live"]}
              onChange={(kind) => kind !== "live" && onKind(kind, basics())}
            />
          )}

          <DateTimeRow
            draft={{ ...draft, allDay: false }}
            start={start}
            end={end}
            hasEvents={hasEvents}
            onStartDate={setStartDate}
            onEndDate={(date) =>
              set("endDate", toDateKey(date < start ? start : date))
            }
            onStartTime={setStartTime}
            onEndTime={(time) =>
              set(
                "endTime",
                draft.date === draft.endDate && time < draft.startTime
                  ? draft.startTime
                  : time,
              )
            }
            timeZone="Lagos time"
          />

          <div className="mt-[11px] flex flex-wrap items-center pl-[18px]">
            <RepeatField
              start={start}
              value={draft.repeat}
              onChange={(rule) => set("repeat", rule)}
            />
          </div>

          {timeProblem && (
            <p className="mt-2 pl-[30px] font-work text-xs text-text-error">
              {timeProblem}
            </p>
          )}

          <DescriptionField
            value={draft.description}
            limit={DESCRIPTION_LIMIT}
            onChange={(description) => set("description", description)}
          />
        </div>

        <div aria-hidden className="hidden bg-[#e1e6ed] md:block" />

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="live-type" className={labelClass}>
              Who it&rsquo;s for
            </label>
            <SelectInput
              id="live-type"
              value={draft.type}
              onChange={(type) => set("type", type)}
              options={typeOptions(asMentor ? mentorTypes : allTypes)}
              chevron={<ArrowDown01 className="size-5" />}
              chevronClassName="text-text-primary"
              className={selectClass}
            />
            <p className="font-work text-xs text-text-secondary">
              {sessionTypes[draft.type].hint}
            </p>
          </div>

          {needs.includes("cohortId") && (
            <Picker
              id="live-cohort"
              label="Cohort"
              value={cohortId}
              onChange={(cohortId) =>
                setDraft((d) => ({
                  ...d,
                  cohortId,
                  hostId: ME,
                  ...(d.type === "MENTORSHIP_GROUP" && { mentorId: "" }),
                }))
              }
              loading={asMentor ? myMentees.isPending : cohorts.isPending}
              options={cohortOptions}
            />
          )}

          {needs.includes("trackId") && (
            <Picker
              id="live-track"
              label="Track"
              value={draft.trackId}
              onChange={(trackId) =>
                setDraft((d) => ({ ...d, trackId, hostId: ME }))
              }
              loading={tracks.isPending}
              options={(tracks.data ?? []).map((track) => ({
                value: track.id,
                label: track.name,
              }))}
            />
          )}

          {needs.includes("mentorId") && !asMentor && (
            <Picker
              id="live-mentor"
              label="Mentor"
              value={draft.mentorId}
              onChange={(mentorId) =>
                setDraft((d) => ({ ...d, mentorId, mentorshipId: "" }))
              }
              loading={mentors.isPending}
              options={(mentors.data ?? [])
                .filter((m) => m.status === "active")
                .map((m) => ({ value: m.id, label: m.name || m.email }))}
            />
          )}

          {needs.includes("mentee") && (
            <Picker
              id="live-mentee"
              label="Student"
              value={draft.mentorshipId}
              onChange={(mentorshipId) => set("mentorshipId", mentorshipId)}
              disabled={!mentorId}
              placeholder={mentorId ? undefined : "Pick a mentor first"}
              loading={mentorId !== "" && menteeQuery.isPending}
              empty={
                menteeQuery.isSuccess && menteeOptions.length === 0
                  ? asMentor
                    ? "You have no students yet"
                    : "This mentor has no students yet"
                  : undefined
              }
              options={menteeOptions.map((m) => ({
                value: m.mentorshipId,
                label: m.name,
              }))}
            />
          )}

          {needs.includes("invitees") && (
            <div className="flex flex-col gap-1">
              <span className={labelClass}>
                Guests <span className="text-text-error">*</span>
              </span>
              <GuestsField
                value={draft.guests}
                onChange={(guests) => set("guests", guests)}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="live-host" className={labelClass}>
              Host
            </label>
            {mentored ? (
              <p className="flex h-9 items-center rounded-lg bg-neutral-100 px-3 font-work text-sm text-text-secondary">
                {asMentor ? "You" : mentor ? mentor.name : "The mentor hosts it"}
              </p>
            ) : (
              <SelectInput
                id="live-host"
                value={draft.hostId}
                onChange={(hostId) => set("hostId", hostId)}
                options={hostOptions}
                chevron={<ArrowDown01 className="size-5" />}
                chevronClassName="text-text-primary"
                className={selectClass}
                popupClassName="max-h-60"
              />
            )}
          </div>
        </div>
      </div>

      {create.isError && (
        <p role="alert" className="mt-4 font-work text-sm text-text-error">
          {create.error.message ||
            "We couldn't schedule the session. Please try again."}
        </p>
      )}

      <CalendarDialogActions
        submitLabel={create.isPending ? "Scheduling…" : "Schedule session"}
        disabled={!canSubmit || create.isPending}
        className="mt-[26px]"
      />
    </form>
  );
}

function Picker({
  id,
  label,
  value,
  onChange,
  options,
  loading,
  disabled,
  placeholder,
  empty,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  empty?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClass}>
        {label} <span className="text-text-error">*</span>
      </label>
      <SelectInput
        id={id}
        value={value}
        onChange={onChange}
        options={options}
        disabled={disabled || loading || Boolean(empty)}
        placeholder={
          loading
            ? "Loading…"
            : (empty ?? placeholder ?? `Select ${label.toLowerCase()}`)
        }
        chevron={<ArrowDown01 className="size-5" />}
        chevronClassName="text-text-primary"
        className={selectClass}
        popupClassName="max-h-60"
      />
    </div>
  );
}

/** The live session form in its own dialog, for the Live sessions page. */
export function LiveSessionFormDialog({
  open,
  onOpenChange,
  initial,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: LiveSessionBasics;
  onCreated: (title: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="max-h-[calc(100vh-2rem)] w-[805px] overflow-y-auto rounded-3xl border-0 bg-neutral-50 p-6 shadow-none sm:p-6"
      >
        {open && (
          <LiveSessionForm
            initial={initial}
            hasEvents={() => false}
            onCreated={(title) => {
              onCreated(title);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** The Live sessions page's "Schedule live session" button and its dialog. */
export function ScheduleLiveSessionButton() {
  const [open, setOpen] = React.useState(false);
  const [initial, setInitial] = React.useState<LiveSessionBasics | null>(null);
  const [scheduled, setScheduled] = React.useState<string | null>(null);
  const dismiss = React.useCallback(() => setScheduled(null), []);

  return (
    <>
      <Button
        size="medium"
        onClick={() => {
          setInitial(blankDraft(new Date()));
          setOpen(true);
        }}
        className="gap-1.5"
      >
        <Add01 className="size-5" />
        Schedule live session
      </Button>
      {initial && (
        <LiveSessionFormDialog
          open={open}
          onOpenChange={setOpen}
          initial={initial}
          onCreated={setScheduled}
        />
      )}
      {scheduled && (
        <SuccessToast
          title="Live session scheduled"
          message={`“${scheduled}” has been added to your live sessions`}
          onDismiss={dismiss}
        />
      )}
    </>
  );
}

type Scope = NonNullable<UpdateLiveSessionInput["scope"]>;

const scopes: { value: Scope; label: string }[] = [
  { value: "THIS_OCCURRENCE", label: "This session" },
  {
    value: "THIS_AND_FUTURE_OCCURRENCES",
    label: "This and following sessions",
  },
  { value: "ALL_OCCURRENCES", label: "All sessions" },
];

/** Picks which sessions of a series a change or cancellation covers. */
export function ScopeChoice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-9 items-center rounded-lg border px-3 text-left font-work text-sm",
              value === option.value
                ? "border-brand-primary bg-brand-100 text-brand-primary"
                : "border-neutral-200 text-text-primary hover:bg-neutral-100",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Changes a scheduled session's title, time and description, and the guests
 * of an explicit-invite session. Who it's for and who hosts it are fixed;
 * people can be added to any other kind of session once it's live.
 */
function EditLiveSessionForm({
  session,
  onSaved,
}: {
  session: LiveSession;
  onSaved: (title: string) => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = React.useState({
    title: session.title,
    description: session.description,
    date: session.date,
    endDate: session.endDate,
    startTime: session.startTime,
    endTime: session.endTime,
  });
  const [scope, setScope] = React.useState<Scope>("THIS_OCCURRENCE");
  const invitesGuests = session.type === "EXPLICIT_INVITE";
  const invitees = useQuery({
    ...liveSessionQueries.invitees(session.id),
    enabled: invitesGuests,
  });
  const [guests, setGuests] = React.useState<EventGuest[] | null>(null);
  const shownGuests = guests ?? invitees.data ?? [];
  const set = <K extends keyof typeof draft>(
    key: K,
    value: (typeof draft)[K],
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const zone = session.timeZone;
  const start = fromDateKey(draft.date);
  const end = fromDateKey(draft.endDate);
  const startsAt = zonedTimeToIso(draft.date, draft.startTime, zone);
  const endsAt = zonedTimeToIso(draft.endDate, draft.endTime, zone);
  const [now] = React.useState(() => Date.now());
  const timeProblem =
    Date.parse(startsAt) <= now
      ? "Pick a start time that hasn't passed yet."
      : Date.parse(endsAt) <= Date.parse(startsAt)
        ? "The session has to end after it starts."
        : null;
  const canSubmit =
    draft.title.trim().length > 0 &&
    !timeProblem &&
    (!invitesGuests || (invitees.isSuccess && shownGuests.length > 0));

  const save = useMutation({
    mutationFn: async () => {
      await updateLiveSession(session.id, {
        ...(session.seriesId && { scope }),
        title: draft.title.trim(),
        description: draft.description.trim(),
        scheduledStartAt: startsAt,
        scheduledEndAt: endsAt,
        timezone: zone,
      });
      if (!invitesGuests || guests === null) return;
      const before = new Set((invitees.data ?? []).map((guest) => guest.id));
      const after = new Set(guests.map((guest) => guest.id));
      const series = scope === "THIS_OCCURRENCE" ? null : session.seriesId;
      const added = [...after].filter((id) => !before.has(id));
      if (added.length > 0) await addInvitees(session.id, added, series);
      await Promise.all(
        [...before]
          .filter((id) => !after.has(id))
          .map((id) => removeInvitee(session.id, id, series)),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: liveSessionKeys.all });
      onSaved(draft.title.trim());
    },
  });

  const setStartDate = (date: Date) => {
    const length = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    setDraft((d) => ({
      ...d,
      date: toDateKey(date),
      endDate: toDateKey(addDays(date, Math.max(0, length))),
    }));
  };
  const setStartTime = (time: string) => {
    const length = minutesOf(draft.endTime) - minutesOf(draft.startTime);
    const endMinutes = Math.min(
      minutesOf(time) + Math.max(0, length),
      23 * 60 + 45,
    );
    setDraft((d) => ({
      ...d,
      startTime: time,
      endTime: times[endMinutes / 15],
    }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit && !save.isPending) save.mutate();
      }}
    >
      <CalendarDialogHeader title="Edit live session" />

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,436px)_1px_minmax(0,272px)]">
        <div className="flex min-w-0 flex-col">
          <TitleField
            value={draft.title}
            onChange={(title) => set("title", title)}
          />

          <DateTimeRow
            draft={{ ...draft, allDay: false }}
            start={start}
            end={end}
            hasEvents={() => false}
            onStartDate={setStartDate}
            onEndDate={(date) =>
              set("endDate", toDateKey(date < start ? start : date))
            }
            onStartTime={setStartTime}
            onEndTime={(time) =>
              set(
                "endTime",
                draft.date === draft.endDate && time < draft.startTime
                  ? draft.startTime
                  : time,
              )
            }
            timeZone={zone === DEFAULT_TIME_ZONE ? "Lagos time" : zone}
          />

          {timeProblem && (
            <p className="mt-2 pl-[30px] font-work text-xs text-text-error">
              {timeProblem}
            </p>
          )}

          <DescriptionField
            value={draft.description}
            limit={DESCRIPTION_LIMIT}
            onChange={(description) => set("description", description)}
          />
        </div>

        <div aria-hidden className="hidden bg-[#e1e6ed] md:block" />

        <div className="flex min-w-0 flex-col gap-4">
          <Fixed
            label="Who it’s for"
            value={`${sessionTypes[session.type].label} · ${session.trackName}`}
          />
          {invitesGuests && (
            <div className="flex flex-col gap-1">
              <span className={labelClass}>
                Guests <span className="text-text-error">*</span>
              </span>
              {invitees.isPending ? (
                <p className="flex h-9 items-center rounded-lg bg-neutral-100 px-3 font-work text-sm text-text-muted">
                  Loading guests…
                </p>
              ) : invitees.isError ? (
                <p className="font-work text-sm text-text-error">
                  We couldn&rsquo;t load the guests.{" "}
                  <button type="button" onClick={() => invitees.refetch()} className="cursor-pointer underline">
                    Try again
                  </button>
                </p>
              ) : (
                <GuestsField value={shownGuests} onChange={setGuests} />
              )}
            </div>
          )}
          <Fixed label="Host" value={session.hostName || "Not set"} />

          {session.seriesId && (
            <ScopeChoice
              label="Apply changes to"
              options={scopes}
              value={scope}
              onChange={setScope}
            />
          )}
        </div>
      </div>

      {save.isError && (
        <p role="alert" className="mt-4 font-work text-sm text-text-error">
          {save.error.message ||
            "We couldn't save your changes. Please try again."}
        </p>
      )}

      <CalendarDialogActions
        submitLabel={save.isPending ? "Saving…" : "Save changes"}
        disabled={!canSubmit || save.isPending}
        className="mt-[26px]"
      />
    </form>
  );
}

/** A detail that can't be changed once the session is scheduled. */
function Fixed({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={labelClass}>{label}</span>
      <p className="flex min-h-9 items-center rounded-lg bg-neutral-100 px-3 py-1.5 font-work text-sm text-text-secondary">
        {value}
      </p>
    </div>
  );
}

export function EditLiveSessionDialog({
  session,
  onOpenChange,
  onSaved,
}: {
  /** The session being edited; null keeps the dialog closed. */
  session: LiveSession | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (title: string) => void;
}) {
  return (
    <Dialog open={session !== null} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="max-h-[calc(100vh-2rem)] w-[805px] overflow-y-auto rounded-3xl border-0 bg-neutral-50 p-6 shadow-none sm:p-6"
      >
        {session && (
          <EditLiveSessionForm
            key={session.id}
            session={session}
            onSaved={(title) => {
              onSaved(title);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
