"use client";

import * as React from "react";
import { useDataChannel } from "@livekit/components-react";
import { useQuery } from "@tanstack/react-query";

import { liveSessionQueries, sendChatMessage, type ChatMessage } from "@/lib/live-sessions";

export const CHAT_TOPIC = "rise.chat";

type ChatPacket = { type: "chat.message"; message: ChatMessage };

/** A message in the room; `pending` while it's still on its way to the backend. */
export type RoomChatMessage = ChatMessage & { pending?: boolean };

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
 * and passed around the room on `rise.chat`. What you send shows straight
 * away and settles once the backend has it.
 */
export function useSessionChat(
  sessionId: string,
  canRead: boolean,
  /** Called once for each message that arrives from someone else while in the room. */
  onIncoming?: (message: ChatMessage) => void,
  /** You, as the sender of the messages that show before they're saved. */
  me: ChatMessage["sender"] = { id: "", name: "" },
) {
  const history = useQuery({ ...liveSessionQueries.chat(sessionId), enabled: canRead });
  const [live, setLive] = React.useState<ChatMessage[]>([]);
  const [pending, setPending] = React.useState<RoomChatMessage[]>([]);

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

  const messages = React.useMemo(() => {
    const saved = merge(history.data ?? [], live);
    // Once the saved copy is in (from the backend or the room), it replaces the pending one.
    const savedIds = new Set(saved.map((message) => message.clientMessageId).filter(Boolean));
    return [...saved, ...pending.filter((message) => !savedIds.has(message.clientMessageId))] as RoomChatMessage[];
  }, [history.data, live, pending]);

  async function send(body: string) {
    const clientMessageId = crypto.randomUUID();
    const draft: RoomChatMessage = {
      id: `pending-${clientMessageId}`,
      body,
      clientMessageId,
      createdAt: new Date().toISOString(),
      sender: me,
      pending: true,
    };
    setPending((current) => [...current, draft]);
    const settle = () => setPending((current) => current.filter((message) => message !== draft));
    try {
      const { message, delivered } = await sendChatMessage(sessionId, body, clientMessageId);
      setLive((current) => merge(current, [{ ...message, clientMessageId: message.clientMessageId ?? clientMessageId }]));
      settle();
      // The backend says when it couldn't reach the room itself; then this
      // browser passes the saved message on. Repeats are dropped by id.
      if (!delivered) {
        const packet: ChatPacket = { type: "chat.message", message };
        await publish(encoder.encode(JSON.stringify(packet)), { reliable: true, topic: CHAT_TOPIC }).catch(() => {});
      }
    } catch (error) {
      settle();
      throw error;
    }
  }

  return { messages, send, loading: history.isPending && canRead };
}
