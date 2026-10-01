import React from 'react';
import { toDateKey } from '../../db/helpers';
import { hhmmToMin } from '../../lib/week';

export default function DayList({ data, now, todayKey, editMode, onOpenSlot }) {
  const { days, dayNumbers, slotsByDay, subjects, lessons } = data;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="space-y-4">
      {days.map((d, i) => {
        const n = dayNumbers[i];
        const daySlots = slotsByDay[n] || [];
        const key = toDateKey(d);
        const isToday = key === todayKey;

        return (
          <section
            key={key}
            className={`rounded-2xl border ${
              isToday ? 'border-primary' : 'border-slate-200'
            } bg-surface overflow-hidden`}
          >
            <header
              className={`px-4 py-2 flex items-center justify-between ${
                isToday ? 'bg-primary text-on-primary' : 'bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-70">
                  {d.toLocaleDateString(undefined, { weekday: 'long' })}
                </div>
                <div className="font-semibold">
                  {d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="text-xs opacity-70">
                {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
              </div>
            </header>

            {daySlots.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-400 text-center">
                No classes scheduled
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {daySlots.map(slot => {
                  const subject = subjects[slot.subjectId];
                  const lesson = lessons[`${slot.id}:${key}`];
                  const inProgress =
                    isToday &&
                    nowMin >= hhmmToMin(slot.startTime) &&
                    nowMin < hhmmToMin(slot.endTime);
                  const past = isToday && nowMin >= hhmmToMin(slot.endTime);

                  return (
                    <li key={slot.id}>
                      <button
                        onClick={() => onOpenSlot(slot, d)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 ${
                          past && !editMode ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="w-14 text-[11px] text-slate-500 font-mono">
                          {slot.startTime}
                          <div className="text-slate-300">{slot.endTime}</div>
                        </div>
                        <span
                          className="w-1.5 h-10 rounded-full"
                          style={{ backgroundColor: subject?.color || '#94a3b8' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">
                            {subject?.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {slot.classLevel} {slot.room ? `· ${slot.room}` : ''}
                            {lesson ? ' · has lesson plan' : ''}
                          </div>
                        </div>
                        {editMode ? (
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                            Edit
                          </span>
                        ) : inProgress ? (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                            NOW
                          </span>
                        ) : null}
                        <span className="text-slate-300">›</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
