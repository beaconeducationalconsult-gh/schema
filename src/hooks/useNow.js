import { useEffect, useState } from 'react';
import { timetable, toMin, toDateKey } from '../db/helpers';

/**
 * Returns { current, next, now, minutesToNext, minutesLeftInClass, isInClass, slots, allSlots }
 * Re-renders every 15 s so the NOW screen stays fresh.
 */
export function useNow(refreshMs = 15_000) {
  const [now, setNow] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  useEffect(() => {
    let alive = true;
    const day = now.getDay() === 0 ? 7 : now.getDay();
    Promise.all([
      timetable.byDay(day),
      timetable.all(),
    ]).then(([todayRows, allRows]) => {
      if (!alive) return;
      setSlots(todayRows);
      setAllSlots(
        allRows.slice().sort((a, b) =>
          a.dayOfWeek !== b.dayOfWeek
            ? a.dayOfWeek - b.dayOfWeek
            : a.startTime.localeCompare(b.startTime)
        )
      );
    });
    return () => { alive = false; };
  }, [now.getDay()]);

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
