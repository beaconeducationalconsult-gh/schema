import React from 'react';
import { toDateKey } from '../../db/helpers';
import { hhmmToMin } from '../../lib/week';

export default function WeekGrid({ data, now, todayKey, onOpenSlot, onEditSlot }) {
  const { days, dayNumbers, slotsByDay, subjects, lessons } = data;

  const nowMin = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="overflow-x-auto print:overflow-visible">
      <div
        className="grid gap-2 min-w-[720px] print:min-w-0 print:gap-1"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}
      >
        {/* Header row */}
        {days.map((d) => {
          const key = toDateKey(d);
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={`px-3 py-2 rounded-t-xl text-center ${
                isToday ? 'bg-primary text-on-primary' : 'bg-surface text-slate-700'
              }`}
            >
              <div className="text-xs uppercase tracking-wider opacity-70">
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className="text-lg font-semibold">{d.getDate()}</div>
            </div>
          );
        })}

        {/* Slot area per day */}
        {days.map((d, i) => {
          const n = dayNumbers[i];
          const daySlots = slotsByDay[n] || [];
          const key = toDateKey(d);
          const isToday = key === todayKey;

          return (
            <div
              key={key}
              className={`space-y-2 p-1.5 rounded-b-xl ${
                isToday ? 'bg-primary/5 ring-1 ring-primary/15' : 'bg-surface'
              }`}
            >
              {daySlots.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">
                  Free day
                </div>
              ) : (
                daySlots.map(slot => {
                  const lesson = lessons[`${slot.id}:${key}`];
                  const subject = subjects[slot.subjectId];
                  const inProgress =
                    isToday &&
                    nowMin >= hhmmToMin(slot.startTime) &&
                    nowMin < hhmmToMin(slot.endTime);
                  const past =
                    isToday && nowMin >= hhmmToMin(slot.endTime);

                  return (
                    <div
                      key={slot.id + key}
                      className={`relative w-full text-left rounded-xl p-2.5 border transition group ${
                        inProgress
                          ? 'border-emerald-500 ring-2 ring-emerald-200 bg-surface'
                          : past
                            ? 'border-slate-100 bg-slate-50 opacity-75'
                            : 'border-slate-200 bg-surface hover:border-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => onOpenSlot(slot, d)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center gap-2 pr-6">
                          <span
                            className="w-1.5 h-6 rounded-full shrink-0"
                            style={{ backgroundColor: subject?.color || '#94a3b8' }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-slate-500 font-medium">
                              {slot.startTime}–{slot.endTime}
                            </div>
                            <div className="text-xs font-semibold text-slate-800 truncate">
                              {subject?.name || '—'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-xs text-slate-400 truncate">
                            {slot.room || ''}
                          </span>
                          {lesson ? (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary text-on-primary">
                              lesson
                            </span>
                          ) : null}
                        </div>

                        {inProgress && (
                          <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                            NOW
                          </span>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditSlot?.(slot);
                        }}
                        aria-label="Edit slot"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                      >
                        ⋯
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
