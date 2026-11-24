"use client";

import * as React from "react";
import { useDataChannel } from "@livekit/components-react";
import { useQuery } from "@tanstack/react-query";

import { liveSessionQueries, sendChatMessage, type ChatMessage } from "@/lib/live-sessions";

export const CHAT_TOPIC = "rise.chat";

type ChatPacket = { type: "chat.message"; message: ChatMessage };

const decoder = new TextDecoder();
const encoder = new TextEncoder();

/** Adds messages that aren't there yet, keeping the list oldest first. */
function merge(current: ChatMessage[], incoming: ChatMessage[]) {
  const seen = new Set(current.map((message) => message.id));
  const fresh = incoming.filter((message) => !seen.has(message.id));
  if (!fresh.length) return current;
  return [...current, ...fresh].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * The session chat: history from the backend, new messages saved through it
 * and passed around the room on `rise.chat`.
 */
export function useSessionChat(
  sessionId: string,
  canRead: boolean,
  /** Called once for each message that arrives from someone else while in the room. */
  onIncoming?: (message: ChatMessage) => void,
) {
  const history = useQuery({ ...liveSessionQueries.chat(sessionId), enabled: canRead });
  const [live, setLive] = React.useState<ChatMessage[]>([]);
  const [sending, setSending] = React.useState(false);

  const { send: publish } = useDataChannel(CHAT_TOPIC, (packet) => {
    try {
      const data = JSON.parse(decoder.decode(packet.payload)) as ChatPacket;
      if (data.type !== "chat.message" || !data.message?.id) return;
      const known = live.some((message) => message.id === data.message.id);
      setLive((current) => merge(current, [data.message]));
      if (!known) onIncoming?.(data.message);
    } catch {
      // Not a chat message.
    }
  });

  const messages = React.useMemo(() => merge(history.data ?? [], live), [history.data, live]);

  async function send(body: string) {
    setSending(true);
    try {
      const { message, delivered } = await sendChatMessage(sessionId, body, crypto.randomUUID());
      setLive((current) => merge(current, [message]));
      // The backend says when it couldn't reach the room itself; then this
      // browser passes the saved message on. Repeats are dropped by id.
      if (!delivered) {
        const packet: ChatPacket = { type: "chat.message", message };
        await publish(encoder.encode(JSON.stringify(packet)), { reliable: true, topic: CHAT_TOPIC }).catch(() => {});
      }
    } finally {
      setSending(false);
    }
  }

  return { messages, send, sending, loading: history.isPending && canRead };
}
