import { describe, it, expect } from 'vitest';
import {
  dueReminders,
  reminderKey,
  reminderMessage,
  loadReminded,
  saveReminded,
} from '../src/lib/reminders';

const at = (h, m, s = 0) => new Date(2026, 8, 30, h, m, s);
const DATE = '2026-09-30';
const maths = { id: 1, subjectId: 1, startTime: '09:00', endTime: '09:40', classLevel: 'Basic 6', room: 'Room 3' };
const english = { id: 2, subjectId: 2, startTime: '10:00', endTime: '10:40' };

describe('dueReminders', () => {
  it('fires only inside the lead window, before the class starts', () => {
    const slots = [maths, english];
    expect(dueReminders(slots, at(8, 50), DATE, 5)).toEqual([]);          // 10 min out
    expect(dueReminders(slots, at(8, 55), DATE, 5)).toEqual([maths]);     // exactly 5 min
    expect(dueReminders(slots, at(8, 59, 59), DATE, 5)).toEqual([maths]);
    expect(dueReminders(slots, at(9, 0), DATE, 5)).toEqual([]);           // started
    expect(dueReminders(slots, at(9, 30), DATE, 5)).toEqual([]);
  });

  it('does not repeat a reminder that was already shown', () => {
    const reminded = new Set([reminderKey(DATE, maths)]);
    expect(dueReminders([maths], at(8, 57), DATE, 5, reminded)).toEqual([]);
    // …but a different day is a different key
    expect(dueReminders([maths], at(8, 57), '2026-10-01', 5, reminded)).toEqual([maths]);
  });

  it('is off at 0 (or junk) minutes and honours bigger leads', () => {
    expect(dueReminders([maths], at(8, 59), DATE, 0)).toEqual([]);
    expect(dueReminders([maths], at(8, 59), DATE, undefined)).toEqual([]);
    expect(dueReminders([maths], at(8, 30), DATE, 30)).toEqual([maths]);
  });
});

describe('reminderMessage', () => {
  it('names the subject, minutes left and where', () => {
    const m = reminderMessage(maths, { name: 'Mathematics' }, at(8, 55, 10));
    expect(m.title).toBe('Mathematics starts in 5 min');
    expect(m.body).toBe('09:00 – 09:40 · Basic 6 · Room 3');
  });
  it('never says "0 min" and copes with a missing subject/room', () => {
    const m = reminderMessage(english, undefined, at(9, 59, 50));
    expect(m.title).toBe('Class starts in 1 min');
    expect(m.body).toBe('10:00 – 10:40');
  });
});

describe('reminded storage', () => {
  const fakeStorage = () => {
    const data = {};
    return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
  };
  it('round-trips for the same day and resets on a new day', () => {
    const st = fakeStorage();
    saveReminded(DATE, new Set(['a', 'b']), st);
    expect([...loadReminded(DATE, st)].sort()).toEqual(['a', 'b']);
    expect(loadReminded('2026-10-01', st).size).toBe(0);
  });
  it('survives corrupt data', () => {
    const st = fakeStorage();
    st.setItem('tc-reminded', '{not json');
    expect(loadReminded(DATE, st).size).toBe(0);
  });
});
