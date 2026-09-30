import { describe, it, expect } from 'vitest';
import { startOfWeek, weekDays, addWeeks, dayIndex, hhmmToMin, isSameWeek, formatWeekRange } from '../src/lib/week';
import { toDateKey } from '../src/db/helpers';

describe('week helpers', () => {
  it('finds Monday for any day of the week, including Sunday', () => {
    expect(toDateKey(startOfWeek(new Date(2026, 8, 30)))).toBe('2026-09-28'); // Wed
    expect(toDateKey(startOfWeek(new Date(2026, 9, 4)))).toBe('2026-09-28'); // Sun
  });

  it('supports Sunday-start weeks', () => {
    expect(toDateKey(startOfWeek(new Date(2026, 8, 30), 0))).toBe('2026-09-27');
  });

  it('returns 5 or 7 days', () => {
    const ws = startOfWeek(new Date(2026, 8, 30));
    expect(weekDays(ws)).toHaveLength(5);
    expect(weekDays(ws, { includeWeekend: true })).toHaveLength(7);
  });

  it('adds weeks across month boundaries', () => {
    const ws = startOfWeek(new Date(2026, 8, 30));
    expect(toDateKey(addWeeks(ws, 1))).toBe('2026-10-05');
    expect(toDateKey(addWeeks(ws, -1))).toBe('2026-09-21');
  });

  it('maps getDay() to a Monday-first index', () => {
    expect(dayIndex(new Date(2026, 8, 28))).toBe(0);
    expect(dayIndex(new Date(2026, 9, 4))).toBe(6);
  });

  it('parses HH:MM', () => {
    expect(hhmmToMin('08:40')).toBe(520);
    expect(hhmmToMin('')).toBe(0);
  });

  it('Sunday-start weeks: Sun–Sat with weekends, Mon–Fri without', () => {
    const ws = startOfWeek(new Date(2026, 8, 30), 0); // Sun 27 Sep
    const keys = (days) => days.map(toDateKey);
    expect(keys(weekDays(ws, { includeWeekend: true, weekStartsOn: 0 }))).toEqual([
      '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03',
    ]);
    expect(keys(weekDays(ws, { weekStartsOn: 0 }))).toEqual([
      '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02',
    ]);
  });

  it('isSameWeek respects the week start (Sunday belongs to the next week only when Sunday starts it)', () => {
    const sun = new Date(2026, 9, 4);
    const fri = new Date(2026, 9, 2);
    expect(isSameWeek(sun, fri)).toBe(true);        // Mon-start: Sun closes the week
    expect(isSameWeek(sun, fri, 0)).toBe(false);    // Sun-start: Sun opens the next one
  });

  it('formats the range from the days actually shown', () => {
    const ws = startOfWeek(new Date(2026, 8, 30), 0);
    expect(formatWeekRange(ws, { weekStartsOn: 0 })).toMatch(/28/);
    expect(formatWeekRange(ws, { weekStartsOn: 0 })).not.toMatch(/\b27\b/);
    expect(formatWeekRange(ws, { includeWeekend: true, weekStartsOn: 0 })).toMatch(/\b27\b/);
  });
});
