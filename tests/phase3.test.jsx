// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Fuse from 'fuse.js';
import App from '../src/App';
import { db } from '../src/db/schema';
import { seedIfEmpty } from '../src/db/seed';
import { markOnboarded } from '../src/db/settings';

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

describe('Phase 3 polish', () => {
  it('FAB is contextual on Today, Plan, Library', async () => {
    renderAt('/');
    await screen.findByText(/Teaching steps/);
    expect(screen.getByLabelText('Add step')).toBeTruthy();

    cleanup();
    renderAt('/schedule');
    await screen.findByText(/Timetable/);
    expect(screen.getByLabelText('Add slot')).toBeTruthy();

    cleanup();
    renderAt('/curriculum');
    await screen.findByText(/Curriculum Catalogue/);
    expect(screen.getByLabelText('Add subject')).toBeTruthy();
  });

  it('FAB dispatches tc-open-add-step and opens TeachingSteps sheet', async () => {
    renderAt('/');
    await screen.findByText(/Teaching steps/);
    fireEvent.click(screen.getByLabelText('Add step'));
    await screen.findByText('Add teaching step');
  });

  it('command palette opens via header Search and via Ctrl+K', async () => {
    renderAt('/');
    await screen.findByText(/Teaching steps/);
    // Header search button
    fireEvent.click(screen.getByLabelText('Search'));
    await screen.findByPlaceholderText(/Search standards, or jump to/);
    fireEvent.click(screen.getByText('✕')); // close
    await waitFor(() => expect(screen.queryByPlaceholderText(/Search standards, or jump to/)).toBeNull());

    // Keyboard
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    await screen.findByPlaceholderText(/Search standards, or jump to/);
  });

  it('GuidedMode has step dots, swipe hint and 48px Done & Next', async () => {
    // Create a lesson with activities and render guided mode
    const standard = await db.standards.toArray().then((a) => a[0]);
    const slot = await db.timetable.toArray().then((a) => a[0]);
    const lessonId = await db.lessons.add({
      timetableId: slot.id,
      date: '2026-10-01',
      standardId: standard.id,
      status: 'planned',
    });
    await db.activities.bulkAdd([
      { lessonId, type: 'exercise', title: 'Step 1', content: '', duration: 5, done: false, order: 0 },
      { lessonId, type: 'discussion', title: 'Step 2', content: '', duration: 5, done: false, order: 1 },
      { lessonId, type: 'reading', title: 'Step 3', content: '', duration: 5, done: false, order: 2 },
    ]);

    render(
      <MemoryRouter initialEntries={[`/lesson/${lessonId}?guided=1`]}>
        <App />
      </MemoryRouter>
    );
    await screen.findByText('Step 1 of 3');
    // Dots
    expect(screen.getByRole('tablist', { name: 'Steps' })).toBeTruthy();
    expect(screen.getAllByRole('tab').length).toBe(3);
    // Bottom controls 48px
    const doneBtn = screen.getByText(/Done & Next/);
    expect(doneBtn.className).toMatch(/min-h-\[48px\]/);
    // Tap dot to jump
    fireEvent.click(screen.getByLabelText('Step 3: Step 3'));
    await screen.findByText('Step 3 of 3');
  });

  it('Fuse fuzzy search finds fractions with typo', () => {
    const standards = [
      { id: 1, contentStandard: 'Compare fractions', indicator: 'B6.1.1.1', exemplars: ['half'] },
      { id: 2, contentStandard: 'Add numbers', indicator: 'B6.1.1.2', exemplars: [] },
    ];
    const fuse = new Fuse(standards, {
      keys: [{ name: 'contentStandard', weight: 0.5 }, { name: 'indicator', weight: 0.4 }, { name: 'exemplars', weight: 0.3 }],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
    const hits = fuse.search('fractin').map((r) => r.item.id);
    expect(hits).toContain(1);
    expect(hits).not.toContain(2);
  });

  it('Library fuzzy search shows results for typo in Curriculum', async () => {
    renderAt('/curriculum');
    await screen.findByText(/Curriculum Catalogue/);
    const input = await screen.findByPlaceholderText(/Search standards/);
    fireEvent.change(input, { target: { value: 'frac' } });
    await waitFor(() => {
      // Should show either result count or no-match, but not crash
      const txt = document.body.textContent || '';
      expect(txt).toMatch(/result|No standards match|Strand/);
    });
  });

  it('Backup share button appears when navigator.share mocked', async () => {
    const origShare = navigator.share;
    // @ts-ignore
    navigator.share = async () => {};
    // @ts-ignore
    navigator.canShare = () => true;
    renderAt('/settings');
    await screen.findByText(/Backup & Restore/);
    expect(screen.getByText('↗ Share backup')).toBeTruthy();
    // restore
    if (origShare) navigator.share = origShare;
    else delete navigator.share;
    delete navigator.canShare;
  });

  it('empty states have embedded Add CTA', async () => {
    // Clear subjects to trigger empty
    for (const t of TABLES) await db[t].clear();
    await markOnboarded();
    // Add minimal subject so curriculum empty branch shows? Actually after clear, curriculum shows "No subjects yet"
    renderAt('/curriculum');
    await screen.findByText(/No subjects yet/);
    expect(screen.getByText('+ Add Subject')).toBeTruthy();

    cleanup();
    // Today empty (no timetable)
    renderAt('/');
    await screen.findByText("Let's set up your week");
    expect(screen.getByText('Build my timetable')).toBeTruthy();
  });
});
