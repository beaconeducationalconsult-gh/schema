// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AppNav from '../src/components/AppNav';
import DialogHost from '../src/components/DialogHost';
import ClassReminders from '../src/components/ClassReminders';
import StatusBanner from '../src/features/now/StatusBanner';
import { dialogStore, dismissToast } from '../src/lib/dialogs';
import { db } from '../src/db/schema';
import { saveSettings } from '../src/db/settings';
import { toDateKey } from '../src/db/helpers';

const TABLES = ['subjects', 'strands', 'subStrands', 'standards', 'timetable', 'lessons', 'activities', 'notes', 'resources', 'settings'];
beforeEach(async () => {
  for (const t of TABLES) await db[t].clear();
  localStorage.clear();
  // toasts live in a module-level store, so clear them between tests
  dialogStore.getSnapshot().toasts.forEach((t) => dismissToast(t.id));
});
afterEach(cleanup);

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>;
}

describe('bottom nav "More" menu', () => {
  const setup = (path = '/') =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <AppNav />
        <Where />
      </MemoryRouter>
    );

  it('keeps four tabs on the bar and hides History/Settings until opened', () => {
    setup();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    for (const name of ['Now', 'Week', 'Curriculum', 'Notes', 'More']) {
      expect(nav.textContent).toContain(name);
    }
    expect(screen.queryByRole('link', { name: 'History' })).toBeNull();
    expect(screen.getByRole('button', { name: 'More' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('opens, closes on Escape, and closes after navigating', async () => {
    setup();
    const more = screen.getByRole('button', { name: 'More' });
    fireEvent.click(more);
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('link', { name: 'History' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('link', { name: 'History' })).toBeNull());

    fireEvent.click(more);
    fireEvent.click(screen.getByRole('link', { name: 'History' }));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/history'));
    expect(screen.queryByRole('link', { name: 'Settings' })).toBeNull();
  });

  it('closes when clicking outside, and More looks active on a hidden route', () => {
    setup('/settings');
    const more = screen.getByRole('button', { name: 'More' });
    expect(more.className).toContain('font-semibold');
    fireEvent.click(more);
    fireEvent.click(screen.getByTestId('more-backdrop'));
    expect(screen.queryByRole('link', { name: 'History' })).toBeNull();
  });

  it('toggles projector mode from the menu', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(screen.getByRole('switch', { name: /projector mode/i }));
    expect(document.documentElement.classList.contains('projector')).toBe(true);
    document.documentElement.classList.remove('projector');
  });

  it('is hidden in guided mode', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/lesson/3?guided=1']}>
        <AppNav />
      </MemoryRouter>
    );
    expect(container.querySelector('nav')).toBeNull();
  });
});

describe('Now status banner countdown ring', () => {
  const slot = { id: 1, startTime: '09:00', endTime: '10:00', room: 'R1', dayOfWeek: 3 };
  const base = {
    isPreviewMode: false, current: null, next: null, activeSlot: slot, minutesToNext: null,
    minutesLeftInClass: null, slots: [], subjectsMap: {}, overrideSlotId: null, onSelectSlot() {},
  };
  const at = (h, m, s = 0) => new Date(2026, 8, 30, h, m, s);

  it('shows the share of the class still left', () => {
    render(<StatusBanner {...base} now={at(9, 15)} isInClass current={slot} minutesLeftInClass={45} />);
    const ring = screen.getByTestId('countdown-ring');
    expect(ring.getAttribute('data-fraction')).toBe('0.750');
    expect(ring.textContent).toContain('45');
    expect(screen.getByText(/IN CLASS · 45 min left/)).toBeTruthy();
  });

  it('counts down the last 15 minutes before the next class, but not earlier', () => {
    const { rerender } = render(
      <StatusBanner {...base} now={at(8, 52, 30)} isInClass={false} next={slot} minutesToNext={8} />
    );
    expect(screen.getByTestId('countdown-ring').getAttribute('data-fraction')).toBe('0.500');

    rerender(<StatusBanner {...base} now={at(8, 20)} isInClass={false} next={slot} minutesToNext={40} />);
    expect(screen.queryByTestId('countdown-ring')).toBeNull();
  });

  it('has no ring while previewing a slot', () => {
    render(<StatusBanner {...base} now={at(9, 15)} isPreviewMode isInClass={false} />);
    expect(screen.queryByTestId('countdown-ring')).toBeNull();
  });
});

describe('class reminders', () => {
  // Build a slot that starts `inMin` minutes from the real clock (skip near midnight).
  async function seedSlotStartingIn(inMin) {
    const now = new Date();
    const start = new Date(now.getTime() + inMin * 60_000);
    if (start.getDate() !== now.getDate()) return null;
    const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const end = new Date(start.getTime() + 40 * 60_000);
    if (end.getDate() !== now.getDate()) return null;
    const subjectId = await db.subjects.add({ name: 'Integrated Science', color: '#0891b2', order: 0 });
    const id = await db.timetable.add({
      dayOfWeek: now.getDay() === 0 ? 7 : now.getDay(),
      startTime: hhmm(start), endTime: hhmm(end), subjectId, classLevel: 'Basic 6', room: 'Lab',
    });
    return { id, dateKey: toDateKey(now) };
  }

  const renderReminders = () =>
    render(
      <MemoryRouter>
        <ClassReminders />
        <DialogHost />
      </MemoryRouter>
    );

  it('shows a toast reminderMinutes before class, once', async () => {
    const seeded = await seedSlotStartingIn(3);
    if (!seeded) return; // too close to midnight to build a same-day slot
    await saveSettings({ prefs: { reminderMinutes: 5 } });
    renderReminders();

    await screen.findByText(/Integrated Science starts in \d+ min/, {}, { timeout: 4000 });
    const saved = JSON.parse(localStorage.getItem('tc-reminded'));
    expect(saved.date).toBe(seeded.dateKey);
    expect(saved.keys).toEqual([`${seeded.dateKey}:${seeded.id}`]);
  });

  it('stays quiet when the class is further away than the reminder lead', async () => {
    const seeded = await seedSlotStartingIn(30);
    if (!seeded) return;
    await saveSettings({ prefs: { reminderMinutes: 5 } });
    renderReminders();
    await act(async () => { await new Promise((r) => setTimeout(r, 600)); });
    expect(screen.queryByText(/starts in/)).toBeNull();
    expect(localStorage.getItem('tc-reminded')).toBeNull();
  });

  it('is switched off by 0 minutes', async () => {
    const seeded = await seedSlotStartingIn(2);
    if (!seeded) return;
    await saveSettings({ prefs: { reminderMinutes: 0 } });
    renderReminders();
    await act(async () => { await new Promise((r) => setTimeout(r, 600)); });
    expect(screen.queryByText(/starts in/)).toBeNull();
    expect(localStorage.getItem('tc-reminded')).toBeNull();
  });
});
