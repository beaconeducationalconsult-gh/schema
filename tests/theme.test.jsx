// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

let systemDark = false;
const listeners = new Set();
function mockMatchMedia() {
  window.matchMedia = (query) => ({
    get matches() { return query.includes('prefers-color-scheme: dark') ? systemDark : false; },
    media: query,
    addEventListener: (_, cb) => listeners.add(cb),
    removeEventListener: (_, cb) => listeners.delete(cb),
    addListener() {}, removeListener() {}, dispatchEvent: () => false,
  });
}

async function loadTheme() {
  vi.resetModules();
  mockMatchMedia();
  return import('../src/lib/theme');
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  document.head.innerHTML = '<meta name="theme-color" content="#0f172a">';
  systemDark = false;
  listeners.clear();
});
afterEach(cleanup);

describe('theme', () => {
  it('defaults to system and follows the OS setting live', async () => {
    const t = await loadTheme();
    t.applyDisplay();
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    systemDark = true;
    listeners.forEach((cb) => cb());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.querySelector('meta[name=theme-color]').content).toBe('#020617');
  });

  it('explicit light/dark override the OS and persist', async () => {
    systemDark = true;
    const t = await loadTheme();
    t.setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('tc-theme')).toBe('light');
    t.setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    t.setTheme('bogus');
    expect(t.getTheme()).toBe('system');
  });

  it('projector mode toggles its class and persists', async () => {
    const t = await loadTheme();
    t.setProjector(true);
    expect(document.documentElement.classList.contains('projector')).toBe(true);
    expect(localStorage.getItem('tc-projector')).toBe('1');
    t.setProjector(false);
    expect(document.documentElement.classList.contains('projector')).toBe(false);
  });

  it('Settings → Display buttons drive the same state', async () => {
    await loadTheme();
    const { default: DisplaySection } = await import('../src/features/settings/DisplaySection');
    render(<DisplaySection />);

    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('radio', { name: 'Dark' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'System' }).getAttribute('aria-checked')).toBe('false');

    fireEvent.click(screen.getByRole('checkbox', { name: /projector mode/i }));
    expect(document.documentElement.classList.contains('projector')).toBe(true);
  });
});
