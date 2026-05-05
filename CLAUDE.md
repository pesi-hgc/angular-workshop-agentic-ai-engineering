# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BookMonkey** — an Angular 20 workshop app for learning AI-assisted development. Books are fetched from a local mock API (`bookmonkey-api`) and displayed with search and pagination.

## Commands

```bash
npm start                # Dev server at http://localhost:4200
npm run build            # Production build
npm run format.write     # Format all files with Prettier (120 char line width)
npx bookmonkey-api       # Start mock book API at http://localhost:4730 (required for data)
npx playwright test      # Run E2E tests
```

The app requires the bookmonkey API running separately — without it, all HTTP calls fail.

## Architecture

**Standalone components** — no NgModule. Every component declares `standalone: true` and lists its imports directly.

**App configuration** (`src/app/app.config.ts`) — wires `provideHttpClient`, `provideRouter`, `provideAnimations` at bootstrap. Add new providers here.

**Books feature** (`src/app/books/`):
- `BookApiClient` — injectable service; all HTTP calls go through it, targeting `http://localhost:4730`
- `BookListComponent` — fetches books on init, debounces search (300 ms), manages `loading` boolean state
- `BookItemComponent` — presentational card, receives a `Book` via `@Input()`
- `Book` interface — defines the data shape

**Shared** (`src/app/shared/`):
- `ToastService` — thin wrapper around `MatSnackBar`

**Routing** (`src/app/app.routes.ts`) — single route; `BookListComponent` at `/`, wildcard redirects to `/`.

**State pattern**: components hold local state with class fields and subscribe to observables returned from services. `@ngrx/signals` and `@tanstack/angular-query-experimental` are installed but not yet used — they are workshop exercise targets.

## Styling

- **Tailwind CSS 4** (utility classes in templates) + **Angular Material** (used for snack bar / overlays)
- Global styles in `src/styles.css`; Material theme in `src/material-theme.scss`
- Responsive grid: 1 col → 2 col → 4–5 col with Tailwind breakpoints

## TypeScript

Strict mode is fully enabled (`strict: true`, `strictTemplates: true`). All new code must type-check without errors. Use `npm run build` or the dev server to surface type errors quickly.
