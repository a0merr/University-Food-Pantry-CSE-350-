// Time helpers. The pantry runs in one time zone, so timestamps are stored as
// local ISO strings ("2026-11-09T13:30:00"), which sort and compare as text.
// AI-generated (Claude Code) - see docs/AI_USAGE.md

const pad = (n) => String(n).padStart(2, '0');

export function toLocalIso(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function toLocalDate(date) {
  return toLocalIso(date).slice(0, 10);
}

/** Parses "YYYY-MM-DDTHH:MM[:SS]" as local time. Returns null when invalid. */
export function parseLocalIso(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(text ?? ''));
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  if (h > 23 || mi > 59 || (s || 0) > 59) return null;
  const date = new Date(y, mo - 1, d, h, mi, s || 0);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  // A time skipped by daylight saving (e.g. 2:30 AM on spring-forward day) rolls forward; reject it.
  if (date.getHours() !== h || date.getMinutes() !== mi) return null;
  return date;
}

/** Parses "YYYY-MM-DD". Returns null when invalid. */
export function parseLocalDate(text) {
  return parseLocalIso(`${text}T00:00`);
}

/** "Fri, Sep 25 at 1:30 PM" */
export function formatSlot(startsAt) {
  const d = parseLocalIso(startsAt);
  if (!d) return String(startsAt);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day} at ${time}`;
}

export const systemClock = { now: () => new Date() };
