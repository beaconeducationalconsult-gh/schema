import { describe, it, expect } from 'vitest';
import {
  academicStartYear, defaultAcademicYear, defaultTerms, currentTerm,
} from '../src/lib/academicYear';

describe('academic year', () => {
  it('starts in August/September', () => {
    expect(defaultAcademicYear(new Date(2026, 8, 30))).toBe('2026/2027'); // 30 Sep 2026
    expect(defaultAcademicYear(new Date(2027, 0, 15))).toBe('2026/2027'); // Jan 2027
    expect(defaultAcademicYear(new Date(2027, 6, 31))).toBe('2026/2027'); // Jul 2027
    expect(academicStartYear(new Date(2027, 7, 1))).toBe(2027); // Aug 2027
  });

  it('builds three ordered, non-overlapping terms', () => {
    const t = defaultTerms(2026);
    expect(t.map((x) => x.label)).toEqual(['Term 1', 'Term 2', 'Term 3']);
    expect(t[0].from).toBe('2026-09-08');
    expect(t[2].to).toBe('2027-07-30');
    for (let i = 0; i < 3; i++) expect(t[i].from < t[i].to).toBe(true);
    expect(t[0].to < t[1].from && t[1].to < t[2].from).toBe(true);
  });

  it('finds the current term, or null during holidays', () => {
    const t = defaultTerms(2026);
    expect(currentTerm(t, new Date(2026, 9, 5)).label).toBe('Term 1');
    expect(currentTerm(t, new Date(2027, 1, 1)).label).toBe('Term 2');
    expect(currentTerm(t, new Date(2027, 0, 1))).toBeNull(); // Christmas break
    expect(currentTerm([], new Date())).toBeNull();
  });
});
