"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { ArrowLeft01, Search01 } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import { adminQueries } from "@/lib/admin";
import { roleLabel } from "@/lib/live-room";
import { cn } from "@/lib/utils";

type Person = { id: string; name: string; email: string };

/**
 * The participants panel's "Add people" view: search the academy and bring
 * people into the call now. They get a notification to join.
 */
export function InvitePeople({
  inRoom,
  onInvite,
  onBack,
}: {
  /** User ids already in the call, who can't be invited again. */
  inRoom: Set<string>;
  onInvite: (people: Person[]) => Promise<void>;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState("");
  const [picked, setPicked] = React.useState<Person[]>([]);
  const [sending, setSending] = React.useState(false);
  const query = useQuery({
    ...adminQueries.users({ search: search.trim() || undefined, status: "ACTIVE", limit: 20 }),
    placeholderData: (previous) => previous,
  });
  const people = (query.data?.items ?? []).filter((user) => !inRoom.has(user.id));
  const pickedIds = new Set(picked.map((person) => person.id));

  const toggle = (person: Person) =>
    setPicked((current) =>
      pickedIds.has(person.id) ? current.filter((p) => p.id !== person.id) : [...current, person],
    );

  async function send() {
    setSending(true);
    try {
      await onInvite(picked);
      setPicked([]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex cursor-pointer items-center gap-1.5 self-start text-sm text-white/60 transition-colors hover:text-white"
      >
        <ArrowLeft01 className="size-4" />
        Back to participants
      </button>

      <label className="flex h-11 items-center gap-2 rounded-xl border border-room-panel-border bg-room-panel-raised px-3 focus-within:border-white">
        <Search01 className="size-5 shrink-0 text-white/60" />
        <input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          aria-label="Search people"
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60"
        />
      </label>

      <ul aria-label="People" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {query.isPending && <li className="py-6 text-center text-sm text-white/60">Loading people…</li>}
        {query.isError && (
          <li className="py-6 text-center text-sm text-room-danger">We couldn&rsquo;t load people. Try again.</li>
        )}
        {query.isSuccess && people.length === 0 && (
          <li className="py-6 text-center text-sm text-white/60">
            {search.trim() ? "No one matches that search" : "Everyone is already here"}
          </li>
        )}
        {people.map((user) => {
          const person = { id: user.id, name: user.name || user.email, email: user.email };
          const on = pickedIds.has(user.id);
          const label = roleLabel(user.role) || "Student";
          return (
            <li key={user.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(person)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/5",
                  on && "bg-white/5",
                )}
              >
                <PersonAvatar name={person.name} src={user.image} colorKey={user.id} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white">{person.name}</span>
                  <span className="block truncate text-xs text-white/60">
                    {label} · {user.email}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border",
                    on ? "border-white bg-white text-room-panel" : "border-room-panel-border",
                  )}
                >
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-white/60">
          They&rsquo;ll get a notification to join this call now.
        </p>
        <button
          type="button"
          disabled={picked.length === 0 || sending}
          onClick={() => void send()}
          className="h-11 cursor-pointer rounded-xl bg-white text-sm font-medium text-room-panel transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending
            ? "Inviting…"
            : picked.length === 0
              ? "Invite people"
              : `Invite ${picked.length === 1 ? picked[0].name : `${picked.length} people`}`}
        </button>
      </div>
    </>
  );
}
