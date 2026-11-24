"use client";

import * as React from "react";
import { useIsMuted, useParticipantAttributes } from "@livekit/components-react";
import { Track, type Participant } from "livekit-client";

import {
  ArrowDown01,
  Cancel01,
  ComputerScreenShareOff,
  Mic02,
  MicOff02,
  MoreHorizontal,
  Pin,
  Sent,
  UserRemove01,
  VideoOff,
  WavingHand02,
} from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { feedbackFor, FEEDBACK_ATTRIBUTE, HAND_ATTRIBUTE, LABEL_ATTRIBUTE } from "@/lib/live-room";
import { personName, type ChatMessage } from "@/lib/live-sessions";
import { cn } from "@/lib/utils";
import { displayName } from "./ParticipantTile";
import { insertMention, mentionMatches, mentionQuery, splitMentions, type Mentionable } from "./mentions";
import { RoomMenuContent, RoomMenuItem } from "./RoomMenu";

export type PanelTab = "participants" | "chat";

const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** The side panel's frame: a title, an optional count, and a close button. */
function Panel({
  title,
  count,
  onClose,
  children,
}: {
  title: string;
  count?: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside
      aria-label={title}
      className="flex min-h-0 flex-col gap-4 rounded-3xl bg-room-panel px-5 pt-5 pb-5 max-lg:fixed max-lg:inset-0 max-lg:z-40 max-lg:rounded-none sm:px-10 lg:w-[444px] lg:shrink-0"
    >
      <header className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-xl/7 font-semibold text-white">
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-room-chip px-3 py-1 text-base/5 font-normal">{count}</span>
          )}
        </h2>
        <button
          type="button"
          aria-label={`Close ${title.toLowerCase()}`}
          onClick={onClose}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
        >
          <Cancel01 className="size-6" />
        </button>
      </header>
      {children}
    </aside>
  );
}

/** Everyone in the session; hosts can mute, remove and act on everyone. */
export function ParticipantsPanel({
  participants,
  isHost,
  pinned,
  onClose,
  onPin,
  onMute,
  onStopShare,
  onRemove,
  onMuteAll,
  onCamerasOff,
  onDisableScreenShare,
}: {
  participants: Participant[];
  isHost: boolean;
  pinned: string | null;
  onClose: () => void;
  onPin: (identity: string | null) => void;
  onMute: (participant: Participant) => void;
  onStopShare: (participant: Participant) => void;
  onRemove: (participant: Participant) => void;
  onMuteAll: () => void;
  onCamerasOff: () => void;
  onDisableScreenShare: () => void;
}) {
  const [actionsOpen, setActionsOpen] = React.useState(false);

  return (
    <Panel title="Participants" count={participants.length} onClose={onClose}>
      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {participants.map((participant) => (
          <ParticipantRow
            key={participant.identity}
            participant={participant}
            isHost={isHost}
            pinned={pinned === participant.identity}
            onPin={() => onPin(pinned === participant.identity ? null : participant.identity)}
            onMute={() => onMute(participant)}
            onStopShare={() => onStopShare(participant)}
            onRemove={() => onRemove(participant)}
          />
        ))}
      </ul>

      {isHost && (
        <section className="rounded-xl border border-room-panel-border bg-room-panel-raised">
          <button
            type="button"
            aria-expanded={actionsOpen}
            onClick={() => setActionsOpen((open) => !open)}
            className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-base font-medium text-white"
          >
            Participant actions
            <ArrowDown01 className={cn("size-6 transition-transform", actionsOpen && "rotate-180")} />
          </button>
          {actionsOpen && (
            <div className="grid grid-cols-3 gap-4 px-4 pb-4">
              <ActionTile label="Mute all participants" icon={<MicOff02 />} onClick={onMuteAll} />
              <ActionTile label="Turn off all cameras" icon={<VideoOff />} onClick={onCamerasOff} />
              <ActionTile label="Disable screen share" icon={<ComputerScreenShareOff />} onClick={onDisableScreenShare} />
            </div>
          )}
        </section>
      )}
    </Panel>
  );
}

function ActionTile({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[96px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[14px] bg-room-tile-action px-2 text-center text-xs/4 font-medium text-white transition-colors hover:bg-room-control-hover [&_svg]:size-[18px] [&_svg]:text-room-danger"
    >
      {icon}
      {label}
    </button>
  );
}

function ParticipantRow({
  participant,
  isHost,
  pinned,
  onPin,
  onMute,
  onStopShare,
  onRemove,
}: {
  participant: Participant;
  isHost: boolean;
  pinned: boolean;
  onPin: () => void;
  onMute: () => void;
  onStopShare: () => void;
  onRemove: () => void;
}) {
  const name = displayName(participant);
  const micOff = useIsMuted({ participant, source: Track.Source.Microphone });
  const sharing = !useIsMuted({ participant, source: Track.Source.ScreenShare });
  const { attributes } = useParticipantAttributes({ participant });
  const handRaised = Boolean(attributes?.[HAND_ATTRIBUTE]);
  const feedback = feedbackFor(attributes?.[FEEDBACK_ATTRIBUTE]);
  const label = attributes?.[LABEL_ATTRIBUTE];
  const canManage = isHost && !participant.isLocal;

  return (
    <li className="flex min-h-[52px] items-center gap-4">
      <PersonAvatar name={name} colorKey={participant.identity} size={36} className="size-[38px]" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <p className="w-full truncate text-base text-white">
          {name}
          {participant.isLocal && " (You)"}
        </p>
        {label && (
          <span className="rounded-full border border-info-border bg-info-surface px-1.5 text-xs/[18px] text-text-info">
            {label}
          </span>
        )}
      </div>
      {feedback && (
        <span role="img" aria-label={feedback.label} title={feedback.label} className="text-base">
          {feedback.emoji}
        </span>
      )}
      {handRaised && <WavingHand02 aria-label="Hand raised" className="size-5 text-room-active" />}
      {micOff ? (
        <MicOff02 aria-label="Muted" className="size-5 text-room-danger" />
      ) : (
        <Mic02 aria-label="Unmuted" className="size-5 text-white" />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Options for ${name}`}
          className="flex size-7 cursor-pointer items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <MoreHorizontal className="size-6" />
        </DropdownMenuTrigger>
        <RoomMenuContent align="end" className="w-[200px]">
          {/* Only they can unmute themselves again. */}
          {canManage && !micOff && (
            <RoomMenuItem onClick={onMute}>
              <MicOff02 />
              Mute
            </RoomMenuItem>
          )}
          {canManage && sharing && (
            <RoomMenuItem onClick={onStopShare}>
              <ComputerScreenShareOff />
              Stop screen share
            </RoomMenuItem>
          )}
          <RoomMenuItem onClick={onPin}>
            <Pin />
            {pinned ? "Unpin from stage" : "Pin to stage"}
          </RoomMenuItem>
          {canManage && (
            <RoomMenuItem variant="destructive" onClick={onRemove}>
              <UserRemove01 />
              Remove from session
            </RoomMenuItem>
          )}
        </RoomMenuContent>
      </DropdownMenu>
    </li>
  );
}

/** The session chat, kept with the session so it can be read afterwards. */
export function ChatPanel({
  messages,
  userId,
  onSend,
  sending,
  loading = false,
  canSend = true,
  blockedReason = "The host has turned off chat",
  maxLength = 2000,
  people = [],
  selfName = "",
  onClose,
}: {
  messages: ChatMessage[];
  /** The signed-in user, whose messages sit on the right. */
  userId: string;
  /** Who can be tagged with "@": everyone else in the room. */
  people?: Mentionable[];
  /** The signed-in user's name, to highlight messages that tag them. */
  selfName?: string;
  onSend: (message: string) => Promise<unknown>;
  sending: boolean;
  loading?: boolean;
  canSend?: boolean;
  /** Shown in the message box when they can't send. */
  blockedReason?: string;
  maxLength?: number;
  onClose: () => void;
}) {
  const [draft, setDraft] = React.useState("");
  const listRef = React.useRef<HTMLOListElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [caret, setCaret] = React.useState(0);
  const [highlight, setHighlight] = React.useState(0);
  const [mentionClosed, setMentionClosed] = React.useState(false);

  const typing = mentionClosed ? null : mentionQuery(draft, caret);
  const suggestions = typing ? mentionMatches(people, typing.query) : [];
  const picking = suggestions.length > 0;
  // Names to pick out of messages: people here now, and anyone who wrote.
  const names = [...people.map((person) => person.name), selfName, ...messages.map((message) => personName(message.sender))];

  function pick(person: Mentionable) {
    if (!typing) return;
    const next = insertMention(draft, typing.start, caret, person.name);
    setDraft(next.text);
    setCaret(next.caret);
    setHighlight(0);
    requestAnimationFrame(() => inputRef.current?.setSelectionRange(next.caret, next.caret));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!picking) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setHighlight((index) => (index + step + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      pick(suggestions[Math.min(highlight, suggestions.length - 1)]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setMentionClosed(true);
    }
  }

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setDraft("");
    try {
      await onSend(message);
    } catch {
      // Put it back so it isn't lost; the failure itself is announced by the room.
      setDraft(message);
    }
  }

  return (
    <Panel title="Chat" onClose={onClose}>
      <ol ref={listRef} aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {messages.length === 0 && (
          <li className="m-auto max-w-[240px] text-center font-work text-sm text-room-text-muted">
            {loading ? "Loading messages…" : "Messages are only seen by people invited to this session."}
          </li>
        )}
        {messages.map((message, index) => {
          const sender = message.sender;
          const own = sender.id === userId;
          const previous = messages[index - 1];
          const sentAt = Date.parse(message.createdAt);
          const grouped = previous?.sender.id === sender.id && sentAt - Date.parse(previous.createdAt) < 60_000;
          const name = personName(sender) || "Someone";

          return (
            <li key={message.id} className={cn("flex gap-2.5", own && "flex-col items-end", !grouped && "mt-3")}>
              {!own && (
                <span className="w-7 shrink-0">
                  {!grouped && (
                    <PersonAvatar name={name} src={sender.image ?? undefined} colorKey={sender.id} size={24} className="size-7" />
                  )}
                </span>
              )}
              <div className={cn("flex min-w-0 flex-col gap-1", own && "items-end")}>
                {!grouped && (
                  <p className="flex items-baseline gap-2 text-xs/4 text-room-text-strong">
                    {!own && <span className="truncate">{name}</span>}
                    <time dateTime={message.createdAt} className="text-[10px] text-room-text-muted">
                      {timeFormat.format(sentAt)}
                    </time>
                  </p>
                )}
                <MessageBody body={message.body} names={names} own={own} selfName={selfName} />
              </div>
            </li>
          );
        })}
      </ol>
      <form onSubmit={submit} className="relative">
        {picking && (
          <ul
            id="mention-options"
            role="listbox"
            aria-label="People to mention"
            className="absolute inset-x-0 bottom-full mb-2 flex max-h-[240px] flex-col gap-0.5 overflow-y-auto rounded-2xl border border-room-menu-border bg-room-menu p-2 shadow-[0_8px_24px_rgb(0_0_0/0.5)]"
          >
            {suggestions.map((person, index) => (
              <li
                key={person.id}
                id={`mention-${person.id}`}
                role="option"
                aria-selected={index === highlight}
                // Keeps the message box focused while picking.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(person)}
                onMouseEnter={() => setHighlight(index)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-white",
                  index === highlight && "bg-white/10",
                )}
              >
                <PersonAvatar name={person.name} colorKey={person.id} size={24} className="size-7" />
                <span className="truncate">{person.name}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2 rounded-xl border border-room-panel-border bg-room-panel-raised px-4 py-1.5 focus-within:border-room-text-muted">
          <input
            ref={inputRef}
            aria-label="Message"
            role="combobox"
            aria-expanded={picking}
            aria-controls={picking ? "mention-options" : undefined}
            aria-autocomplete="list"
            aria-activedescendant={picking ? `mention-${suggestions[Math.min(highlight, suggestions.length - 1)].id}` : undefined}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setCaret(event.target.selectionStart ?? event.target.value.length);
              setMentionClosed(false);
              setHighlight(0);
            }}
            onSelect={(event) => setCaret(event.currentTarget.selectionStart ?? 0)}
            onKeyDown={onKeyDown}
            placeholder={canSend ? "Send a message, @ to mention someone" : blockedReason}
            disabled={!canSend}
            maxLength={maxLength}
            className="h-9 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-room-text-muted disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!canSend || !draft.trim() || sending}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-room-text-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sent className="size-[18px]" />
          </button>
        </div>
      </form>
    </Panel>
  );
}

/** A chat bubble, with any @names picked out. One that tags you is outlined. */
function MessageBody({ body, names, own, selfName }: { body: string; names: string[]; own: boolean; selfName: string }) {
  const parts = splitMentions(body, names);
  const tagsYou =
    !own && Boolean(selfName) && parts.some((part) => part.mention?.toLowerCase() === selfName.trim().toLowerCase());

  return (
    <p
      className={cn(
        "max-w-[280px] rounded-[20px] px-3 py-2.5 text-sm/5 break-words whitespace-pre-wrap",
        own ? "bg-room-bubble-own text-room-bubble-own-text" : "bg-room-bubble text-room-text",
        tagsYou && "ring-2 ring-room-active",
      )}
    >
      {parts.map((part, index) =>
        part.mention ? (
          <span key={index} className="rounded px-0.5 font-semibold text-room-active">
            {part.text}
          </span>
        ) : (
          <React.Fragment key={index}>{part.text}</React.Fragment>
        ),
      )}
    </p>
  );
}
