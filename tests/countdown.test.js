import { describe, it, expect } from 'vitest';
import { classCountdown, startCountdown } from '../src/lib/countdown';

const at = (h, m, s = 0) => new Date(2026, 8, 30, h, m, s);

describe('classCountdown', () => {
  it('is 1 at the start, 0.5 halfway and 0 at the end', () => {
    expect(classCountdown(at(9, 0), '09:00', '10:00').remaining).toBe(1);
    expect(classCountdown(at(9, 30), '09:00', '10:00').remaining).toBe(0.5);
    expect(classCountdown(at(10, 0), '09:00', '10:00').remaining).toBe(0);
  });

  it('uses seconds, so the ring moves smoothly', () => {
    const c = classCountdown(at(9, 15, 30), '09:00', '10:00');
    expect(c.remainingSec).toBe(44 * 60 + 30);
    expect(c.totalSec).toBe(3600);
  });

  it('clamps outside the slot and rejects zero-length slots', () => {
    expect(classCountdown(at(8, 0), '09:00', '10:00').remaining).toBe(1);
    expect(classCountdown(at(11, 0), '09:00', '10:00').remaining).toBe(0);
    expect(classCountdown(at(9, 0), '09:00', '09:00')).toBeNull();
  });
});

describe('startCountdown', () => {
  it('only exists inside the lead-in window and counts down to the start', () => {
    expect(startCountdown(at(8, 40), '09:00')).toBeNull();            // 20 min out
    expect(startCountdown(at(8, 45), '09:00').remaining).toBe(1);     // window opens
    expect(startCountdown(at(8, 52, 30), '09:00').remaining).toBe(0.5);
    expect(startCountdown(at(9, 0), '09:00').remaining).toBe(0);
    expect(startCountdown(at(9, 1), '09:00')).toBeNull();             // already started
  });
});
