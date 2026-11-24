/**
 * @mentions in the session chat. Messages stay plain text ("@Ada Obi, can you
 * share?"), so they read the same anywhere; the room picks out the names of
 * people it knows to highlight them and to tell the person they were tagged.
 */

export type Mentionable = { id: string; name: string };

/** The "@…" being typed just before the caret, if any. */
export function mentionQuery(text: string, caret: number) {
  const match = /(^|\s)@([^\s@]{0,40})$/.exec(text.slice(0, caret));
  if (!match) return null;
  return { start: caret - match[2].length - 1, query: match[2] };
}

/** People whose name matches what's typed after "@", best matches first. */
export function mentionMatches(people: Mentionable[], query: string, limit = 6) {
  const q = query.toLowerCase();
  return people
    .filter((person) => person.name.toLowerCase().includes(q))
    .sort((a, b) => Number(b.name.toLowerCase().startsWith(q)) - Number(a.name.toLowerCase().startsWith(q)))
    .slice(0, limit);
}

/** Puts "@Name " in place of the "@…" being typed; returns the text and where the caret goes. */
export function insertMention(text: string, start: number, caret: number, name: string) {
  const inserted = `@${name} `;
  return { text: text.slice(0, start) + inserted + text.slice(caret), caret: start + inserted.length };
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function mentionPattern(names: string[]) {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!unique.length) return null;
  // A name counts when it ends at a word boundary: "@Ada" in "@Ada," but not "@Adaeze".
  return new RegExp(`@(${unique.map(escape).join("|")})(?![\\p{L}\\p{N}_])`, "giu");
}

export type MessagePart = { text: string; mention?: string };

/** A message split into plain text and the @names in it. */
export function splitMentions(body: string, names: string[]): MessagePart[] {
  const pattern = mentionPattern(names);
  if (!pattern) return [{ text: body }];
  const parts: MessagePart[] = [];
  let last = 0;
  for (const match of body.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: body.slice(last, index) });
    parts.push({ text: match[0], mention: match[1] });
    last = index + match[0].length;
  }
  if (last < body.length) parts.push({ text: body.slice(last) });
  return parts;
}

/** Whether a message tags this name. */
export function mentions(body: string, name: string) {
  return Boolean(name.trim()) && splitMentions(body, [name]).some((part) => part.mention);
}
