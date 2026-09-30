import { useSyncExternalStore } from 'react';

/**
 * Display preferences, stored per device in localStorage (a projector-friendly
 * setting on the classroom laptop shouldn't follow a backup to a phone).
 *   theme:     'system' | 'light' | 'dark'
 *   projector: bigger type + stronger contrast for showing the screen to a class
 * The inline script in index.html applies the same classes before first paint.
 */
const THEME_KEY = 'tc-theme';
const PROJECTOR_KEY = 'tc-projector';
export const THEMES = ['system', 'light', 'dark'];

const THEME_COLOR = { light: '#0f172a', dark: '#020617' };

const listeners = new Set();
const mql = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;

function read(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode etc. — the class still applies for this session */
  }
}

export function getTheme() {
  const t = read(THEME_KEY, 'system');
  return THEMES.includes(t) ? t : 'system';
}
export function getProjector() {
  return read(PROJECTOR_KEY, '0') === '1';
}
export function resolveDark(theme = getTheme()) {
  return theme === 'dark' || (theme === 'system' && !!mql?.matches);
}

/** Sync <html> classes and the browser-chrome colour with the stored prefs. */
export function applyDisplay() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const dark = resolveDark();
  root.classList.toggle('dark', dark);
  root.classList.toggle('projector', getProjector());
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light));
}

let snapshot = { theme: getTheme(), projector: getProjector(), dark: resolveDark() };
function refresh() {
  snapshot = { theme: getTheme(), projector: getProjector(), dark: resolveDark() };
  applyDisplay();
  listeners.forEach((l) => l());
}

export function setTheme(theme) {
  write(THEME_KEY, THEMES.includes(theme) ? theme : 'system');
  refresh();
}
export function setProjector(on) {
  write(PROJECTOR_KEY, on ? '1' : '0');
  refresh();
}

// Follow the OS when theme === 'system'; stay in sync across tabs.
mql?.addEventListener?.('change', () => getTheme() === 'system' && refresh());
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY || e.key === PROJECTOR_KEY) refresh();
  });
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** { theme, projector, dark } — re-renders when any of them change. */
export function useDisplay() {
  return useSyncExternalStore(subscribe, () => snapshot);
}
