"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Add01, ArrowLeft01, ArrowRight01, Filter } from "@/assets/icons";
import { AdminTopNav } from "@/components/AdminTopNav";
import { CalendarFilterDialog } from "@/components/calendar/CalendarFilterDialog";
import {
  EventDetailsPopover,
  type OpenEvent,
} from "@/components/calendar/EventDetailsPopover";
import {
  blankDraft,
  EventFormDialog,
  type EventDraft,
} from "@/components/calendar/EventFormDialog";
import { Button } from "@/components/ui/button";
import { SuccessToast } from "@/components/ui/toast";
import {
  eventsOn,
  filterEvents,
  monthGrid,
  monthNames,
  noFilters,
  sampleEvents,
  shortTime,
  toDateKey,
  type CalendarEvent,
  type CalendarFilters,
} from "@/lib/calendar";
import { sessionQuery } from "@/lib/session-query";
import { cn } from "@/lib/utils";

type Toast = { title: string; message: string };

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
  // No events API yet: events live here, seeded with the design's samples.
  const [events, setEvents] = React.useState<CalendarEvent[]>(sampleEvents);
  const [openEvent, setOpenEvent] = React.useState<OpenEvent | null>(null);
  const [form, setForm] = React.useState<Form | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<CalendarFilters>(noFilters);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [toast, setToast] = React.useState<Toast | null>(null);
  const dismissToast = React.useCallback(() => setToast(null), []);
  const session = useQuery(sessionQuery());

  const days = monthGrid(view.year, view.month);
  const todayKey = toDateKey(today);
  const viewingToday =
    view.year === today.getFullYear() && view.month === today.getMonth();
  const visibleEvents = filterEvents(events, filters);
  const hasEvents = (date: Date) => eventsOn(visibleEvents, date).length > 0;

  const shiftMonth = (by: number) =>
    setView(({ year, month }) => {
      const next = new Date(year, month + by, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  const openForm = (next: Form) => {
    setOpenEvent(null);
    setForm(next);
    setFormOpen(true);
  };

  const saveEvent = (draft: EventDraft) => {
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

  const deleteEvent = (event: CalendarEvent) => {
    setOpenEvent(null);
    setEvents((all) => all.filter((e) => e.id !== event.id));
    setToast({
      title: "Event deleted",
      message: `“${event.title}” has been removed from the calendar`,
    });
  };

  return (
    <>
      {/* "Calender" is the design's spelling. */}
      <AdminTopNav breadcrumb={["Overview", "Calender"]} />
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
                  className={cn(
                    "h-[120px] min-w-0 border-b border-neutral-200 p-2.5",
                    key === todayKey
                      ? "bg-brand-100"
                      : weekend && "bg-neutral-100",
                  )}
                >
                  <p
                    className={cn(
                      "text-base leading-6",
                      inMonth ? "text-text-primary" : "text-text-muted",
                    )}
                  >
                    {!inMonth && date.getDate() === 1 && (
                      <span className="block">
                        {monthNames[date.getMonth()].slice(0, 3)}
                      </span>
                    )}
                    {date.getDate()}
                  </p>
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
                            onClick={(e) =>
                              setOpenEvent({
                                event,
                                date,
                                anchor: e.currentTarget,
                              })
                            }
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
                              <span className="font-medium">{event.title}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    {hidden > 0 && (
                      <li className="pl-1 font-work text-xs text-text-muted">
                        +{hidden + 1} more
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
        open={openEvent}
        onClose={() => setOpenEvent(null)}
        onEdit={(event) =>
          openForm({ mode: "edit", initial: event, id: event.id })
        }
        onDelete={deleteEvent}
      />

      {form && (
        <EventFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={form.mode}
          initial={form.initial}
          onSubmit={saveEvent}
          hasEvents={hasEvents}
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
          title={toast.title}
          message={toast.message}
          onDismiss={dismissToast}
        />
      )}
    </>
  );
}
