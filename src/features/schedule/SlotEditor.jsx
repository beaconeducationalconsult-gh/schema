import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings } from '../../db/settings';
import { confirmDialog } from '../../lib/dialogs';
import { timetable as timetableRepo } from '../../db/helpers';

const DAYS = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
  { id: 7, label: 'Sunday' },
];

export default function SlotEditor({ slot, subjects, onClose, onSaved }) {
  const [dayOfWeek, setDayOfWeek] = useState(slot?.dayOfWeek || 1);
  const [startTime, setStartTime] = useState(slot?.startTime || '08:00');
  const [endTime, setEndTime] = useState(slot?.endTime || '08:40');
  const [subjectId, setSubjectId] = useState(slot?.subjectId || subjects[0]?.id || '');
  // New slots default to the class level from the teacher's profile.
  const profile = useLiveQuery(getSettings, []);
  const [levelDraft, setClassLevel] = useState(null);
  const classLevel = levelDraft ?? slot?.classLevel ?? profile?.classLevel ?? '';
  const [room, setRoom] = useState(slot?.room || '');

  const save = async () => {
    if (!subjectId || !startTime || !endTime) return;
    const payload = {
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      subjectId: Number(subjectId),
      classLevel: classLevel.trim() || profile?.classLevel || '',
      room: room.trim(),
    };
    if (slot) {
      await timetableRepo.update(slot.id, payload);
    } else {
      await timetableRepo.add(payload);
    }
    onSaved?.();
  };

  const remove = async () => {
    if (!slot) return;
    if (!(await confirmDialog({ title: 'Delete this timetable slot?', confirmLabel: 'Delete', danger: true }))) return;
    await timetableRepo.remove(slot.id);
    onSaved?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
      >
        <h3 className="text-lg font-semibold mb-4">
          {slot ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Day of Week
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-surface"
            >
              {DAYS.map(d => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-surface"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Class Level
              </label>
              <input
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                placeholder="e.g. Basic 6"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Room
              </label>
              <input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Rm 4"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-5">
          {slot ? (
            <button onClick={remove} className="text-sm text-rose-500 hover:underline">
              Delete slot
            </button>
          ) : <span />}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!subjectId}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-on-primary disabled:opacity-40"
            >
              Save Slot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
