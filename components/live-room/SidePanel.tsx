"use client";

import * as React from "react";
import {
  useIsMuted,
  useParticipantAttributes,
  type ReceivedChatMessage,
} from "@livekit/components-react";
import { Track, type Participant } from "livekit-client";

import { Cancel01, Mic02, MicOff02, MoreVertical, Sent, WavingHand02 } from "@/assets/icons";
import { PersonAvatar } from "@/components/PersonAvatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HAND_ATTRIBUTE, ROLE_ATTRIBUTE } from "@/lib/live-room";
import { cn } from "@/lib/utils";
import { displayName } from "./ParticipantTile";
import { RoomMenuContent, RoomMenuItem } from "./RoomMenu";

export type PanelTab = "participants" | "chat";

const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** The side panel: who's here, and the session chat. */
export function SidePanel({
  tab,
  onTabChange,
  onClose,
  title,
  participants,
  messages,
  onSend,
  sending,
  isHost,
  onMute,
  onRemove,
}: {
  tab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  onClose: () => void;
  title: string;
  participants: Participant[];
  messages: ReceivedChatMessage[];
  onSend: (message: string) => Promise<unknown>;
  sending: boolean;
  isHost: boolean;
  onMute: (participant: Participant) => void;
  onRemove: (participant: Participant) => void;
}) {
  return (
    <aside
      aria-label={tab === "chat" ? "Chat" : "Participants"}
      className="flex min-h-0 flex-col rounded-[20px] bg-room-panel shadow-[0_0_0_1px_rgb(255_255_255/0.04)] max-lg:fixed max-lg:inset-0 max-lg:z-40 max-lg:rounded-none lg:w-[320px] lg:shrink-0"
    >
      <header className="flex flex-col gap-4 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="truncate text-[15px]/6 text-room-text">{title}</h2>
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-room-text-muted transition-colors hover:bg-room-control hover:text-white"
          >
            <Cancel01 className="size-[18px]" />
          </button>
        </div>
        <div role="tablist" aria-label="Panel" className="flex w-fit gap-1 rounded-lg bg-room-control p-1">
          {(["participants", "chat"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => onTabChange(value)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors",
                tab === value ? "bg-white text-text-primary shadow-sm" : "text-room-text-muted hover:text-white",
              )}
            >
              {value === "chat" ? "Chat" : `Participants (${participants.length})`}
            </button>
          ))}
        </div>
      </header>

      {tab === "chat" ? (
        <Chat messages={messages} onSend={onSend} sending={sending} />
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
          {participants.map((participant) => (
            <ParticipantRow
              key={participant.identity}
              participant={participant}
              isHost={isHost}
              onMute={() => onMute(participant)}
              onRemove={() => onRemove(participant)}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}

function ParticipantRow({
  participant,
  isHost,
  onMute,
  onRemove,
}: {
  participant: Participant;
  isHost: boolean;
  onMute: () => void;
  onRemove: () => void;
}) {
  const name = displayName(participant);
  const micOff = useIsMuted({ participant, source: Track.Source.Microphone });
  const { attributes } = useParticipantAttributes({ participant });
  const handRaised = Boolean(attributes?.[HAND_ATTRIBUTE]);
  const host = attributes?.[ROLE_ATTRIBUTE] === "host";
  const canManage = isHost && !participant.isLocal;

  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
      <PersonAvatar name={name} colorKey={participant.identity} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-room-text-strong">
          {name}
          {participant.isLocal && " (You)"}
        </p>
        {host && <p className="text-xs text-room-active">Host</p>}
      </div>
      {handRaised && <WavingHand02 aria-label="Hand raised" className="size-[18px] text-room-active" />}
      {micOff ? (
        <MicOff02 aria-label="Muted" className="size-[18px] text-room-text-muted" />
      ) : (
        <Mic02 aria-label="Unmuted" className="size-[18px] text-room-text" />
      )}
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Manage ${name}`}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-room-text-muted hover:bg-room-control hover:text-white"
          >
            <MoreVertical className="size-[18px]" />
          </DropdownMenuTrigger>
          <RoomMenuContent align="end" className="w-[176px]">
            <RoomMenuItem disabled={micOff} onClick={onMute}>
              Mute
            </RoomMenuItem>
            <RoomMenuItem variant="destructive" onClick={onRemove}>
              Remove from session
            </RoomMenuItem>
          </RoomMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}

function Chat({
  messages,
  onSend,
  sending,
}: {
  messages: ReceivedChatMessage[];
  onSend: (message: string) => Promise<unknown>;
  sending: boolean;
}) {
  const [draft, setDraft] = React.useState("");
  const listRef = React.useRef<HTMLOListElement>(null);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setDraft("");
    await onSend(message);
  }

  return (
    <>
      <ol ref={listRef} aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-5 pb-3">
        {messages.length === 0 && (
          <li className="m-auto max-w-[220px] text-center font-work text-sm text-room-text-muted">
            Messages are only seen by people in the session and are cleared when it ends.
          </li>
        )}
        {messages.map((message, index) => {
          const from = message.from;
          const own = from?.isLocal ?? false;
          const previous = messages[index - 1];
          const grouped = previous?.from?.identity === from?.identity && message.timestamp - previous.timestamp < 60_000;
          const name = from ? displayName(from) : "Someone";

          return (
            <li key={message.id} className={cn("flex gap-2.5", own && "flex-col items-end", !grouped && "mt-3")}>
              {!own && (
                <span className="w-7 shrink-0">
                  {!grouped && <PersonAvatar name={name} colorKey={from?.identity} size={24} className="size-7" />}
                </span>
              )}
              <div className={cn("flex min-w-0 flex-col gap-1", own && "items-end")}>
                {!grouped && (
                  <p className="flex items-baseline gap-2 text-[11.5px]/4 text-room-text-strong">
                    {!own && <span className="truncate">{name}</span>}
                    <time className="text-[10px] text-room-text-muted">{timeFormat.format(message.timestamp)}</time>
                  </p>
                )}
                <p
                  className={cn(
                    "max-w-[230px] rounded-[20px] px-3 py-2.5 text-xs/4 break-words whitespace-pre-wrap",
                    own ? "bg-room-bubble-own text-room-bubble-own-text" : "bg-room-bubble text-room-text",
                  )}
                >
                  {message.message}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <form onSubmit={submit} className="px-4 pb-4">
        <div className="flex items-center gap-2 rounded-3xl border border-room-border px-4 py-1.5 focus-within:border-room-text-muted">
          <input
            aria-label="Message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Send a message"
            maxLength={1000}
            className="h-8 min-w-0 flex-1 bg-transparent text-xs text-room-text-strong outline-none placeholder:text-[#bfc1c1]"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim() || sending}
            className="flex size-7 cursor-pointer items-center justify-center rounded-full text-room-text-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sent className="size-[18px]" />
          </button>
        </div>
      </form>
    </>
  );
}
