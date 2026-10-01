// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import { db } from '../src/db/schema';
import { getSettings } from '../src/db/settings';

const TABLES = ['subjects', 'strands', 'subStrands', 'standards', 'timetable', 'lessons', 'activities', 'notes', 'resources', 'settings'];
beforeEach(async () => { for (const t of TABLES) await db[t].clear(); });
afterEach(cleanup);

const renderApp = () => render(<MemoryRouter><App /></MemoryRouter>);

describe('first-run onboarding', () => {
  it('walks through the wizard, then lands on the (empty) Now screen without a reload', async () => {
    renderApp();
    await screen.findByText('Welcome to Teaching Companion');

    // Single-page setup (Phase 2): all fields visible at once, no wizard steps.
    // Keep the original field interactions — teacher name + class level — but finish directly.
    fireEvent.change(screen.getByPlaceholderText('e.g. Mr. Kofi Mensah'), { target: { value: 'Ama Owusu' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Basic 6'), { target: { value: 'Basic 5' } });

    // If the old wizard were still present, Next would navigate; on the new single page there is no Next,
    // so only click it when it exists (keeps the test backward-compatible with either implementation).
    const nextBtn = screen.queryByRole('button', { name: /^next$/i });
    if (nextBtn) {
      fireEvent.click(nextBtn);
      await screen.findByText('Term dates');
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
      await screen.findByText('What do you teach?');
    } else {
      // Single-page: confirm the subjects block is already visible
      await screen.findByText('What do you teach?');
    }
    // Three subjects are pre-selected; add one more and deselect Science.
    fireEvent.click(screen.getByRole('button', { name: 'Science' }));
    fireEvent.change(screen.getByPlaceholderText('Another subject…'), { target: { value: 'Geography' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: /start teaching with 3 subjects/i }));

    await screen.findByText("Let's set up your week");
    expect((await db.subjects.toArray()).map((s) => s.name).sort()).toEqual(['English Language', 'Geography', 'Mathematics']);
    const s = await getSettings();
    expect(s.teacherName).toBe('Ama Owusu');
    expect(s.classLevel).toBe('Basic 5');
  });

  it('skips the wizard for an existing install', async () => {
    await db.subjects.add({ name: 'Maths', order: 0 });
    const { migrateExistingInstall } = await import('../src/db/onboarding');
    await migrateExistingInstall();
    renderApp();
    await waitFor(() => expect(screen.queryByText('Welcome to Teaching Companion')).toBeNull());
  });
});
