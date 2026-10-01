import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { timetable, toMin, toDateKey } from '../db/helpers';

const EMPTY = [];

/**
 * Returns { current, next, now, minutesToNext, minutesLeftInClass, isInClass, slots, allSlots }
 * `now` ticks every 15 s, and the slot lists are live — edit the timetable in
 * another tab or screen and the NOW screen follows immediately.
 */
export function useNow(refreshMs = 15_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  const day = now.getDay() === 0 ? 7 : now.getDay();
  const slots = useLiveQuery(() => timetable.byDay(day), [day], EMPTY);
  const allSlots = useLiveQuery(
    async () =>
      (await timetable.all()).sort((a, b) =>
        a.dayOfWeek !== b.dayOfWeek
          ? a.dayOfWeek - b.dayOfWeek
          : a.startTime.localeCompare(b.startTime)
      ),
    [],
    EMPTY
  );

  const minutes = now.getHours() * 60 + now.getMinutes();
  const current = slots.find(s =>
    minutes >= toMin(s.startTime) && minutes < toMin(s.endTime)
  ) || null;
  const next = slots.find(s => toMin(s.startTime) > minutes) || null;

  return {
    now,
    dateKey: toDateKey(now),
    slots,
    allSlots,
    current,
    next,
    isInClass: !!current,
    minutesToNext: next ? toMin(next.startTime) - minutes : null,
    minutesLeftInClass: current ? toMin(current.endTime) - minutes : null,
  };
}
