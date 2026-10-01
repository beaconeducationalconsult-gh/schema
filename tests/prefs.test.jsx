// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { db } from '../src/db/schema';
import { getSettings, savePrefs, saveSettings, migrateLegacyWeekendPref } from '../src/db/settings';
import { loadWeek } from '../src/db/schedule';
import { startOfWeek } from '../src/lib/week';
import { toDateKey } from '../src/db/helpers';
import WeekScreen from '../src/features/schedule/WeekScreen';
import ActivityPromptBar from '../src/features/now/ActivityPromptBar';

const TABLES = ['subjects', 'strands', 'subStrands', 'standards', 'timetable', 'lessons', 'activities', 'notes', 'resources', 'settings'];
beforeEach(async () => {
  for (const t of TABLES) await db[t].clear();
  localStorage.clear();
});
afterEach(cleanup);

describe('savePrefs', () => {
  it('merges into stored prefs without clobbering the other keys', async () => {
    await savePrefs({ reminderMinutes: 12 });
    await savePrefs({ includeWeekend: true });
    const { prefs } = await getSettings();
    expect(prefs).toMatchObject({ reminderMinutes: 12, includeWeekend: true, weekStartsOn: 1, defaultActivityMinutes: 10 });
  });
});

describe('legacy "Include weekend" toggle', () => {
  it('carries an "on" over to the preference once and removes the old key', async () => {
    localStorage.setItem('week:includeWeekend', '1');
    await migrateLegacyWeekendPref(localStorage);
    expect((await getSettings()).prefs.includeWeekend).toBe(true);
    expect(localStorage.getItem('week:includeWeekend')).toBeNull();
  });
  it('an "off" (or missing) value leaves the preference alone', async () => {
    await savePrefs({ includeWeekend: true });
    localStorage.setItem('week:includeWeekend', '0');
    await migrateLegacyWeekendPref(localStorage);
    expect((await getSettings()).prefs.includeWeekend).toBe(true);
    expect(localStorage.getItem('week:includeWeekend')).toBeNull();
  });
});

describe('loadWeek follows the week preferences', () => {
  it('Sunday start + weekend shows Sun–Sat; weekday view starts Monday', async () => {
    const ws = startOfWeek(new Date(2026, 8, 30), 0);
    const full = await loadWeek(ws, { includeWeekend: true, weekStartsOn: 0 });
    expect(full.days.map(toDateKey)[0]).toBe('2026-09-27');
    expect(full.dayNumbers).toEqual([7, 1, 2, 3, 4, 5, 6]);
    const work = await loadWeek(ws, { weekStartsOn: 0 });
    expect(work.dayNumbers).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('Week screen', () => {
  const renderWeek = () =>
    render(
      <MemoryRouter initialEntries={['/schedule?week=2026-09-30']}>
        <WeekScreen />
      </MemoryRouter>
    );

  it('the weekend checkbox is backed by the preference (and reacts to it live)', async () => {
    renderWeek();
    const box = await screen.findByRole('checkbox', { name: /include weekend/i });
    expect(box.checked).toBe(false);

    fireEvent.click(box);
    await waitFor(async () => expect((await getSettings()).prefs.includeWeekend).toBe(true));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /include weekend/i }).checked).toBe(true));
  });

  it('"Week starts on" changes the range of the same week', async () => {
    await savePrefs({ includeWeekend: true, weekStartsOn: 0 });
    renderWeek();
    // Sun 27 Sep – Sat 3 Oct
    await waitFor(() => expect(screen.getByText(/\b27\b.*\b3\b/).textContent).toBeTruthy());

    await saveSettings({ prefs: { ...(await getSettings()).prefs, weekStartsOn: 1 } });
    // Mon 28 Sep – Sun 4 Oct
    await waitFor(() => expect(screen.getByText(/\b28\b.*\b4\b/).textContent).toBeTruthy());
  });
});

describe('default activity length', () => {
  it('pre-fills the quick-add form from the preference and saves it', async () => {
    await savePrefs({ defaultActivityMinutes: 25 });
    render(<ActivityPromptBar lessonId={1} standard={null} onOpenTemplates={() => {}} />);

    await waitFor(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Exercise/ }));
      expect(screen.getByRole('spinbutton').value).toBe('25');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Activity' }));
    await waitFor(async () => expect((await db.activities.toArray())[0]?.duration).toBe(25));
  });

  it('an edited value wins over the default', async () => {
    await savePrefs({ defaultActivityMinutes: 25 });
    render(<ActivityPromptBar lessonId={1} standard={null} onOpenTemplates={() => {}} />);
    await waitFor(() => screen.getByRole('button', { name: /Exercise/ }));
    fireEvent.click(screen.getByRole('button', { name: /Exercise/ }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Activity' }));
    await waitFor(async () => expect((await db.activities.toArray())[0]?.duration).toBe(7));
  });
});
