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

    fireEvent.change(screen.getByPlaceholderText('e.g. Mr. Kofi Mensah'), { target: { value: 'Ama Owusu' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Basic 6'), { target: { value: 'Basic 5' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByText('Term dates');
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByText('What do you teach?');
    // Three subjects are pre-selected; add one more and deselect Science.
    fireEvent.click(screen.getByRole('button', { name: 'Science' }));
    fireEvent.change(screen.getByPlaceholderText('Another subject…'), { target: { value: 'Geography' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: /start with 3 subjects/i }));

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
