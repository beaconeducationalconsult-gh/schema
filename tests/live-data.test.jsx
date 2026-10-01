// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import { db } from '../src/db/schema';
import { seedIfEmpty } from '../src/db/seed';
import { markOnboarded } from '../src/db/settings';
import { activities as activityRepo, notes as noteRepo } from '../src/db/helpers';

const TABLES = ['subjects', 'strands', 'subStrands', 'standards', 'timetable', 'lessons', 'activities', 'notes', 'resources', 'settings'];

beforeEach(async () => {
  for (const t of TABLES) await db[t].clear();
  await seedIfEmpty();
  await markOnboarded();
});
afterEach(cleanup);

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('live data (no manual reloads)', { timeout: 20000 }, () => {
  it('Curriculum: a subject and a strand written to the DB appear on their own', async () => {
    renderAt('/curriculum');
    await screen.findByRole('button', { name: /Mathematics/ });

    await act(async () => {
      await db.subjects.add({ name: 'Geography', color: '#0891b2', icon: 'globe', order: 99 });
    });
    await screen.findByRole('button', { name: /Geography/ });

    const maths = await db.subjects.where('order').equals(0).first();
    await act(async () => {
      await db.strands.add({ subjectId: maths.id, name: 'Strand 9: Live Strand', order: 50 });
    });
    await screen.findByText('Strand 9: Live Strand');
  });

  it('Now: activities and notes added elsewhere show up immediately', async () => {
    renderAt('/');
    // Wait for the Now screen to load its context, then read the lesson id off its plan link.
    // Phase 2 hero shows "Teaching steps" / "View plan" / "Teach Now" instead of the old "What I'm Teaching" / "Open Lesson Plan".
    await waitFor(async () => {
      const hasOld = screen.queryByText(/What I.m Teaching/);
      const hasNew = screen.queryByText(/Teaching steps/);
      if (!hasOld && !hasNew) throw new Error('Now hero not yet rendered');
    }, { timeout: 4000 });
    const planLink =
      screen.queryAllByText('View plan')[0]?.closest('a') ||
      screen.queryAllByText('Teach Now')[0]?.closest('a') ||
      screen.queryAllByText('Open Lesson Plan')[0]?.closest('a');
    const href = planLink.getAttribute('href');
    const lessonIdStr = href.includes('?') ? href.split('?')[0].split('/').pop() : href.split('/').pop();
    const lesson = { id: Number(lessonIdStr) };

    await act(async () => {
      await activityRepo.add({ lessonId: lesson.id, type: 'exercise', title: 'Live Added Activity', content: '', duration: 5, done: false });
      await noteRepo.add({ lessonId: lesson.id, standardId: null, body: 'Live added note body', tags: [] });
    });
    await screen.findByText(/Live Added Activity/, {}, { timeout: 4000 });
    await screen.findByText(/Live added note body/, {}, { timeout: 4000 });
  });

  it('Settings: storage counts follow the data', async () => {
    renderAt('/settings');
    await screen.findByText(/Local storage/);
    const before = await db.subjects.count();
    const subjectsStat = () => screen.getByText('Subjects').previousSibling.textContent;
    await waitFor(() => expect(subjectsStat()).toBe(String(before)));
    await act(async () => {
      for (let i = 0; i < 3; i++) await db.subjects.add({ name: `S${i}`, order: 100 + i });
    });
    await waitFor(() => expect(subjectsStat()).toBe(String(before + 3)));
  });
});
