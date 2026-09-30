import React from 'react';
import { toDateKey } from '../../db/helpers';
import { hhmmToMin } from '../../lib/week';

export default function WeekGrid({ data, todayKey, editMode, onOpenSlot }) {
  const { days, dayNumbers, slotsByDay, subjects, lessons } = data;

  const now = new Date();
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
                isToday ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider opacity-70">
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
                isToday ? 'bg-slate-900/5 ring-1 ring-slate-900/10' : 'bg-white'
              }`}
            >
              {daySlots.length === 0 ? (
                <div className="text-[11px] text-slate-400 text-center py-6">
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
                    <button
                      key={slot.id + key}
                      onClick={() => onOpenSlot(slot, d)}
                      className={`w-full text-left rounded-xl p-2.5 border transition relative ${
                        editMode
                          ? 'border-amber-300 bg-amber-50/40 hover:border-amber-400'
                          : inProgress
                            ? 'border-emerald-500 ring-2 ring-emerald-200 bg-white'
                            : past
                              ? 'border-slate-100 bg-slate-50 opacity-75'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-6 rounded-full shrink-0"
                          style={{ backgroundColor: subject?.color || '#94a3b8' }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-slate-500 font-medium">
                            {slot.startTime}–{slot.endTime}
                          </div>
                          <div className="text-xs font-semibold text-slate-800 truncate">
                            {subject?.name || '—'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 truncate">
                          {slot.room || ''}
                        </span>
                        {editMode ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                            edit
                          </span>
                        ) : lesson ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-white">
                            lesson
                          </span>
                        ) : null}
                      </div>

                      {inProgress && !editMode && (
                        <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                          NOW
                        </span>
                      )}
                    </button>
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
