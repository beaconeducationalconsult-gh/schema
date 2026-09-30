import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const file = join(process.cwd(), 'src/theme.css');

describe('generated theme.css', () => {
  it('is up to date (run `pnpm theme:gen` after adding text-<colour>-<shade> classes)', () => {
    const committed = readFileSync(file, 'utf8');
    try {
      execFileSync('node', ['scripts/gen-theme-css.mjs'], { cwd: process.cwd(), stdio: 'pipe' });
      expect(readFileSync(file, 'utf8')).toBe(committed);
    } finally {
      writeFileSync(file, committed);
    }
  });

  it('redefines every slate shade for dark mode and restores them for .palette-fixed', () => {
    const css = readFileSync(file, 'utf8');
    for (const s of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      expect(css.match(new RegExp(`--color-slate-${s}:`, 'g')).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('no component uses raw white/black-on-slate surfaces that would ignore dark mode', () => {
    // Guard rail: surfaces must use bg-surface, primary buttons bg-primary/text-on-primary.
    const offenders = [];
    const walk = (dir) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.jsx')) {
          readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
            if (/(?<![\w:-])bg-white(?![\w/-])/.test(line)) offenders.push(`${p}:${i + 1} bg-white`);
            if (/bg-slate-900/.test(line) && /text-white/.test(line) && !/palette-fixed/.test(line)) {
              offenders.push(`${p}:${i + 1} bg-slate-900 + text-white`);
            }
          });
        }
      }
    };
    walk(join(process.cwd(), 'src'));
    expect(offenders).toEqual([]);
  });
});
