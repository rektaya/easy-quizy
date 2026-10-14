// When the next reminder should fire, and what it should say. Pure (no phone APIs), so it can be tested.
//
// A reminder only makes sense when there is something to study. The phone cannot decide that at the moment
// a notification is shown, so the app works it out each time it goes to the background and sets ONE
// notification: at the user's chosen time of day, on the first day when words are ready (reviews that are
// due, or at least a few new words waiting). If nothing will ever be ready, there is none.

export const MIN_NEW_FOR_REMINDER = 3;
const DAY = 24 * 60 * 60 * 1000;

export type ReminderPlan = { at: number; count: number };

/** The first moment at or after `from` when the clock reads hour:minute. */
export function nextTimeOfDay(from: number, hour: number, minute: number): number {
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() < from) d.setDate(d.getDate() + 1);
  return d.getTime();
}

/**
 * @param now        the current time (ms)
 * @param waitingNew how many gathered words have never been studied
 * @param dueTimes   when each studied word comes up for review (ms)
 */
export function planReminder(
  now: number,
  hour: number,
  minute: number,
  waitingNew: number,
  dueTimes: number[],
): ReminderPlan | null {
  const earliest = now + 60 * 1000; // never "in the next few seconds"
  let at = nextTimeOfDay(earliest, hour, minute);
  for (let day = 0; day < 60; day++) {
    const due = dueTimes.filter((t) => t <= at).length;
    const fresh = waitingNew >= MIN_NEW_FOR_REMINDER ? waitingNew : 0;
    if (due + fresh > 0) return { at, count: due + fresh };
    // nothing ready yet: jump to the first day on which a review falls due
    const later = dueTimes.filter((t) => t > at);
    if (later.length === 0) return null;
    at = nextTimeOfDay(Math.max(at + DAY, Math.min(...later)), hour, minute);
  }
  return null;
}

export function reminderText(count: number): { title: string; body: string } {
  return {
    title: 'your words are ready',
    body: count === 1 ? '1 word is waiting for you' : `${count} words are waiting for you`,
  };
}
