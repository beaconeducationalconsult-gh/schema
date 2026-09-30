# Schema – Teaching Companion

An offline-first Progressive Web App that answers one question for a teacher: **"What am I teaching, right now?"**

It matches your weekly timetable to your curriculum (NaCCA-style strands, sub-strands, standards and indicators), builds lessons from activity blocks, and keeps a history of what you have taught. There is no backend. All data stays in the browser (IndexedDB) and can be exported as a JSON backup.

## Features

- **Now** – current timetable slot, the active standard, and quick-add lesson activities
- **Schedule** – weekly timetable (grid and day list) with a slot editor
- **Curriculum** – Subject → Strand → Sub-strand → Standard tree, with bulk text import
- **Lesson** – activity blocks (exercise, correction, image observation, video, reading, discussion, assignment), one-tap routine templates, guided mode with timers, and a print view
- **Notes**, **History** (filters, stats, CSV export) and **Settings** (profile, terms, preferences, backup/restore, storage)
- Installable PWA with offline support and update prompts

## Tech stack

React 19 (with React Compiler) · Vite 8 · React Router 7 · Tailwind CSS 4 · Dexie 4 (IndexedDB) · vite-plugin-pwa / Workbox · Oxlint

## Getting started

Requires Node.js and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # production build to dist/
pnpm preview    # serve the build on :4173
pnpm lint
pnpm test       # Vitest (db layer + date helpers, runs on fake-indexeddb)
```

On first launch the database is seeded with demo subjects, a timetable and sample lessons. Use **Settings → Backup** to export or restore your data, or to reset to the demo seed.

## Project structure

```
src/
  db/          Dexie schema, repositories, seed data, backup, history queries
  features/    Screens: now, schedule, curriculum, lesson, notes, history, settings
  components/  Shared modals, resource gallery, navigation
  lib/         Routine templates, classroom SVG media, week/date helpers
  hooks/       useNow
  pwa/         Service-worker registration, banners, persistent storage
tests/         Vitest specs
public/        Icons, offline page, robots.txt
```

### Data model

`subjects → strands → subStrands → standards` form the curriculum. `timetable` slots reference a subject. `lessons` reference a standard and a slot on a date, and own `activities`. `notes` and `resources` attach to lessons or standards. `settings` is a key/value table.

The database name is `TeachingCompanion` (schema version 2 in `src/db/schema.js`). Any change to indexed fields needs a new `db.version(n)`; `tests/schema-migration.test.js` shows how to test an upgrade. Backups are validated on import, and **merge** mode re-links foreign keys so ids from another device never collide.
