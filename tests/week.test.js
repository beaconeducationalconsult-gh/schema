import { describe, it, expect } from 'vitest';
import { startOfWeek, weekDays, addWeeks, dayIndex, hhmmToMin } from '../src/lib/week';
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
});
