"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Add01, ArrowLeft01, ArrowRight01, Filter } from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import { CalendarFilterDialog } from "@/components/calendar/CalendarFilterDialog";
import { CancelSessionDialog } from "@/components/calendar/CancelSessionDialog";
import { DayEventsDialog, freshOpen } from "@/components/calendar/DayEventsDialog";
import {
  EventDetailsPopover,
  type OpenEvent,
} from "@/components/calendar/EventDetailsPopover";
import {
  blankDraft,
  EventFormDialog,
  type EventDraft,
} from "@/components/calendar/EventFormDialog";
import { EditLiveSessionDialog } from "@/components/calendar/LiveSessionForm";
import { Button } from "@/components/ui/button";
import { SuccessToast } from "@/components/ui/toast";
import {
  addDays,
  eventsOn,
  filterEvents,
  monthGrid,
  longDate,
  monthNames,
  noFilters,
  shortTime,
  toDateKey,
  type CalendarEvent,
  type CalendarFilters,
} from "@/lib/calendar";
import {
  calendarKeys,
  calendarQueries,
  createCalendarTask,
  deleteCalendarItem,
  inCohort,
  setTaskDone,
  toCalendarEvent,
  updateCalendarTask,
} from "@/lib/calendar-events";
import {
  getLiveSession,
  toLiveSession,
  zonedTimeToIso,
  type LiveSession,
} from "@/lib/live-sessions";
import { useSelectedCohort } from "@/lib/selected-cohort";
import { sessionQuery } from "@/lib/session-query";
import { cn } from "@/lib/utils";

type Toast = { title: string; message: string; tone?: "error" };

type Form =
  | { mode: "create"; initial: EventDraft }
  | { mode: "edit"; initial: EventDraft; id: string };

const weekdays = ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];

/** Events shown in a day before the rest collapse into "+N more". */
const VISIBLE_EVENTS = 3;

export default function CalendarPage() {
  const today = React.useMemo(() => new Date(), []);
  const [view, setView] = React.useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  // PENDING-BACKEND: the API has no plain events, so those live here.
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [openEvent, setOpenEvent] = React.useState<OpenEvent | null>(null);
  const [openDay, setOpenDay] = React.useState<Date | null>(null);
  const [form, setForm] = React.useState<Form | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<CalendarFilters>(noFilters);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [toast, setToast] = React.useState<Toast | null>(null);
  const [editingSession, setEditingSession] = React.useState<LiveSession | null>(null);
  const [cancelling, setCancelling] = React.useState<CalendarEvent | null>(null);
  const dismissToast = React.useCallback(() => setToast(null), []);
  const session = useQuery(sessionQuery());
  const queryClient = useQueryClient();
  const { cohortId } = useSelectedCohort();

  const days = monthGrid(view.year, view.month);
  const calendar = useQuery(
    calendarQueries.range({
      from: zonedTimeToIso(toDateKey(days[0]), "00:00"),
      to: zonedTimeToIso(toDateKey(addDays(days[days.length - 1], 1)), "00:00"),
    }),
  );
  const todayKey = toDateKey(today);
  const viewingToday =
    view.year === today.getFullYear() && view.month === today.getMonth();
  // Filtered here rather than by the API's cohortId, which would also hide
  // invite-only sessions (they have no cohort).
  const allEvents = React.useMemo(
    () => [
      ...events,
      ...(calendar.data ?? [])
        .filter((item) => inCohort(item, cohortId))
        .map(toCalendarEvent),
    ],
    [events, calendar.data, cohortId],
  );
  const visibleEvents = filterEvents(allEvents, filters);
  const hasEvents = (date: Date) => eventsOn(visibleEvents, date).length > 0;

  const shiftMonth = (by: number) =>
    setView(({ year, month }) => {
      const next = new Date(year, month + by, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  const openForm = (next: Form) => {
    setOpenEvent(null);
    setOpenDay(null);
    setForm(next);
    setFormOpen(true);
  };

  const saveTask = async (draft: EventDraft, editing?: CalendarEvent) => {
    if (editing?.source === "CALENDAR_TASK") {
      await updateCalendarTask(editing.id, draft);
    } else {
      if (!cohortId) throw new Error("Pick a cohort first: every task belongs to one.");
      await createCalendarTask(draft, cohortId);
      // A local event switched to a task moves to the API.
      if (editing) setEvents((all) => all.filter((e) => e.id !== editing.id));
    }
    await queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    setToast(
      editing
        ? {
            title: "Task updated",
            message: `“${draft.title}” has been successfully updated`,
          }
        : {
            title: "Task created",
            message: `“${draft.title}” has been added to the calendar`,
          },
    );
  };

  const saveEvent = async (draft: EventDraft) => {
    const editing =
      form?.mode === "edit"
        ? allEvents.find((event) => event.id === form.id)
        : undefined;
    // PENDING-BACKEND: a task keeps its title, times and description; the
    // API has nowhere for its repeat, tracks, link, guests, reminders,
    // colour or attachments, and an API task can't become an event.
    if (draft.kind === "task" || editing?.source === "CALENDAR_TASK") {
      return saveTask(draft, editing);
    }
    if (form?.mode === "edit") {
      setEvents((all) =>
        all.map((event) =>
          event.id === form.id ? { ...event, ...draft } : event,
        ),
      );
      setToast({
        title: "Event updated",
        message: `“${draft.title}” has been successfully updated`,
      });
      return;
    }
    setEvents((all) => [
      ...all,
      {
        ...draft,
        id: crypto.randomUUID(),
        organizer: session.data?.user.email ?? "",
      },
    ]);
    setToast({
      title: "Event created",
      message: `“${draft.title}” has been added to the calendar`,
    });
  };

  const editEvent = async (event: CalendarEvent) => {
    if (event.kind !== "live") {
      openForm({ mode: "edit", initial: event, id: event.id });
      return;
    }
    setOpenEvent(null);
    setOpenDay(null);
    try {
      setEditingSession(toLiveSession(await getLiveSession(event.id)));
    } catch {
      setToast({
        tone: "error",
        title: "Couldn't open the session",
        message: "Please try again.",
      });
    }
  };

  const toggleDone = async (event: CalendarEvent, done: boolean) => {
    try {
      await setTaskDone(event.id, done);
      await queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    } catch {
      setToast({
        tone: "error",
        title: "Couldn't update the task",
        message: `“${event.title}” wasn't changed. Please try again.`,
      });
    }
  };

  const deleteEvent = async (event: CalendarEvent) => {
    setOpenEvent(null);
    if (event.kind === "live") {
      setOpenDay(null);
      setCancelling(event);
      return;
    }
    if (event.source) {
      try {
        await deleteCalendarItem(event.id);
        await queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      } catch {
        setToast({
          tone: "error",
          title: "Couldn't delete",
          message: `“${event.title}” is still on the calendar. Please try again.`,
        });
        return;
      }
    }
    setEvents((all) => all.filter((e) => e.id !== event.id));
    setToast({
      title: "Event deleted",
      message: `“${event.title}” has been removed from the calendar`,
    });
  };

  return (
    <>
      {/* "Calender" is the design's spelling. */}
      <AdminTopNav breadcrumb={["Overview", { label: "Calendar", href: "/admin/calendar" }]} />
      <main className="min-w-0 flex-1 px-4 pt-5 pb-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-text-primary hover:bg-neutral-100"
            >
              <ArrowLeft01 className="size-5" />
            </button>
            <h1
              aria-live="polite"
              className="mx-3 min-w-[158px] text-2xl font-semibold text-black"
            >
              {monthNames[view.month]} {view.year}
            </h1>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-text-primary hover:bg-neutral-100"
            >
              <ArrowRight01 className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="ml-6 flex h-10 items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 text-base text-text-primary hover:bg-neutral-100"
            >
              <Filter className="size-4" />
              Filter
            </button>
          </div>
          <Button
            size="medium"
            onClick={() =>
              openForm({
                mode: "create",
                initial: blankDraft(
                  viewingToday ? today : new Date(view.year, view.month, 1),
                ),
              })
            }
            className="mt-1 gap-1.5"
          >
            <Add01 className="size-5" />
            Create event
          </Button>
        </div>

        <div className="mt-[46px] overflow-x-auto">
          <div className="grid min-w-[760px] grid-cols-7">
            {weekdays.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "flex h-11 items-center border-r border-neutral-200 px-2.5 text-base",
                  viewingToday && index === today.getDay()
                    ? "text-brand-primary"
                    : "text-text-muted",
                )}
              >
                {day}
              </div>
            ))}

            {days.map((date) => {
              const key = toDateKey(date);
              const inMonth = date.getMonth() === view.month;
              const weekend = date.getDay() === 0 || date.getDay() === 6;
              const dayEvents = eventsOn(visibleEvents, date);
              const hidden = dayEvents.length - VISIBLE_EVENTS;
              return (
                <div
                  key={key}
                  onClick={() => setOpenDay(date)}
                  className={cn(
                    "h-[120px] min-w-0 cursor-pointer border-b border-neutral-200 p-2.5 transition-colors",
                    key === todayKey
                      ? "bg-brand-100 hover:bg-brand-200/60"
                      : weekend
                        ? "bg-neutral-100 hover:bg-neutral-200/60"
                        : "hover:bg-neutral-50",
                  )}
                >
                  <button
                    type="button"
                    aria-label={`Show events on ${longDate(date)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDay(date);
                    }}
                    className={cn(
                      "rounded-sm text-left text-base leading-6 outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
                      inMonth ? "text-text-primary" : "text-text-muted",
                    )}
                  >
                    {!inMonth && date.getDate() === 1 && (
                      <span className="block">
                        {monthNames[date.getMonth()].slice(0, 3)}
                      </span>
                    )}
                    {date.getDate()}
                  </button>
                  <ul className="mt-1 flex flex-col gap-1">
                    {dayEvents
                      .slice(
                        0,
                        hidden > 0 ? VISIBLE_EVENTS - 1 : VISIBLE_EVENTS,
                      )
                      .map((event) => (
                        <li key={event.id}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenEvent({
                                event,
                                date,
                                anchor: e.currentTarget,
                              });
                            }}
                            className="-ml-[3px] flex h-4 w-full items-center gap-1 rounded-sm text-left font-work text-xs text-text-primary hover:bg-black/5"
                          >
                            <span
                              aria-hidden
                              className="h-4 w-[3px] shrink-0"
                              style={{ backgroundColor: event.color }}
                            />
                            <span className="truncate">
                              {!event.allDay &&
                                `${shortTime(event.startTime)} `}
                              <span
                                className={cn(
                                  "font-medium",
                                  event.done && "text-text-muted line-through",
                                )}
                              >
                                {event.title}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    {hidden > 0 && (
                      <li>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDay(date);
                          }}
                          className="rounded-sm pl-1 font-work text-xs text-text-muted hover:text-text-primary hover:underline"
                        >
                          +{hidden + 1} more
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <EventDetailsPopover
        open={freshOpen(openEvent, allEvents)}
        onClose={() => setOpenEvent(null)}
        onEdit={editEvent}
        onDelete={deleteEvent}
        onToggleDone={toggleDone}
      />

      <DayEventsDialog
        date={openDay}
        events={openDay ? eventsOn(visibleEvents, openDay) : []}
        onClose={() => setOpenDay(null)}
        onCreate={(date) => openForm({ mode: "create", initial: blankDraft(date) })}
        onEdit={editEvent}
        onDelete={deleteEvent}
        onToggleDone={toggleDone}
      />

      <EditLiveSessionDialog
        session={editingSession}
        onOpenChange={(open) => !open && setEditingSession(null)}
        onSaved={(title) =>
          setToast({
            title: "Live session updated",
            message: `“${title}” has been successfully updated`,
          })
        }
      />

      <CancelSessionDialog
        event={cancelling}
        onOpenChange={(open) => !open && setCancelling(null)}
        onCancelled={(title) =>
          setToast({
            title: "Live session cancelled",
            message: `“${title}” has been cancelled and everyone invited was told`,
          })
        }
      />

      {form && (
        <EventFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={form.mode}
          initial={form.initial}
          onSubmit={saveEvent}
          hasEvents={hasEvents}
          onLiveSessionCreated={(title) =>
            setToast({
              title: "Live session scheduled",
              message: `“${title}” has been added to the calendar`,
            })
          }
        />
      )}

      <CalendarFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={filters}
        onApply={setFilters}
      />

      {toast && (
        <SuccessToast
          tone={toast.tone}
          title={toast.title}
          message={toast.message}
          onDismiss={dismissToast}
        />
      )}
    </>
  );
}
