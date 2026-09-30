import React from 'react';
import CountdownRing from './CountdownRing';
import { classCountdown, startCountdown } from '../../lib/countdown';
import { DAY_NAMES } from '../../lib/dayNames';

export default function StatusBanner({
  now,
  isInClass,
  isPreviewMode,
  current,
  next,
  activeSlot,
  minutesToNext,
  minutesLeftInClass,
  slots,
  subjectsMap,
  overrideSlotId,
  onSelectSlot,
}) {
  const tone = isInClass
    ? 'from-emerald-600 to-emerald-500'
    : !isPreviewMode && minutesToNext != null && minutesToNext <= 15
      ? 'from-amber-500 to-amber-400'
      : 'from-slate-800 to-slate-700';

  // Ring: time left in the class, or the last 15 minutes before the next one starts.
  const ring = isInClass && current
    ? { ...classCountdown(now, current.startTime, current.endTime), value: minutesLeftInClass }
    : !isPreviewMode && next
      ? { ...startCountdown(now, next.startTime), value: minutesToNext }
      : null;
  const ringOn = ring && ring.totalSec != null;
  const urgent = ringOn && isInClass && ring.remainingSec <= 5 * 60; // amber ring on the amber banner would vanish

  const title = isInClass
    ? `IN CLASS · ${minutesLeftInClass} min left`
    : !isPreviewMode && next
      ? `NEXT CLASS IN ${minutesToNext} MIN`
      : activeSlot
        ? `PREVIEWING · ${DAY_NAMES[activeSlot.dayOfWeek] || ''} ${activeSlot.startTime}`
        : 'No more classes today';

  const subtitle = isInClass
    ? `${current.startTime} – ${current.endTime} · ${current.room || ''}`
    : !isPreviewMode && next
      ? `${next.startTime} – ${next.endTime} · ${next.room || ''}`
      : activeSlot
        ? `${activeSlot.startTime} – ${activeSlot.endTime} · ${activeSlot.room || ''}`
        : '';

  return (
    <div className={`palette-fixed sticky top-0 z-20 bg-gradient-to-r ${tone} text-white shadow-md`}>
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">
              {now.toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </div>
            <div className="text-lg font-bold tracking-tight">{title}</div>
            {subtitle && <div className="text-xs opacity-90">{subtitle}</div>}
          </div>

          <div className="flex items-center gap-2">
            {slots.length > 0 && (
              <select
                aria-label="Switch timetable slot"
                value={overrideSlotId || ''}
                onChange={(e) => onSelectSlot(e.target.value ? Number(e.target.value) : null)}
                className="text-xs bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-lg px-2.5 py-1.5 backdrop-blur focus:outline-none"
              >
                <option value="" className="text-slate-900">
                  ⏱️ Live Clock
                </option>
                {slots.map(s => {
                  const sub = subjectsMap[s.subjectId];
                  return (
                    <option key={s.id} value={s.id} className="text-slate-900">
                      {DAY_NAMES[s.dayOfWeek]} {s.startTime} · {sub?.name || 'Class'}
                    </option>
                  );
                })}
              </select>
            )}
            {ringOn ? (
              <CountdownRing fraction={ring.remaining} value={ring.value} unit="min" urgent={urgent} />
            ) : (
              <div className="text-2xl hidden sm:block">
                {isInClass ? '🎓' : next ? '⏱️' : '📋'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
