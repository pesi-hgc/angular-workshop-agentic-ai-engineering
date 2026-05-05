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

## Coding Rules

These are hard constraints derived from past refactoring. Violating them requires an explicit reason.

### Templates — control flow

Never use `*ngIf` or `*ngFor`. Always use the Angular 17+ built-in control flow syntax:

```html
@if (loading) { … }
@if (!loading && book) { … } @else { … }
@for (book of books; track book.id) { … }
```

`@for` requires a `track` expression using a unique field (e.g. `book.id`), never `$index`.
Remove `CommonModule` from `imports` arrays — it is only needed for the deprecated directive syntax.

### Templates — async state

Every component that performs an async operation must declare and render all three states:

```ts
loading = true;
error: string | null = null;
data?: SomeType;
```

```html
@if (loading) { <!-- spinner --> }
@else if (error) { <p class="text-red-600">{{ error }}</p> }
@else if (data) { <!-- content --> }
```

Never leave an unhandled state where the template renders nothing silently.

### Subscriptions — teardown

Every `subscribe()` in a component must be preceded by `takeUntilDestroyed(this.destroyRef)`:

```ts
private destroyRef = inject(DestroyRef);

this.someObservable$.pipe(
  takeUntilDestroyed(this.destroyRef)
).subscribe(…);
```

No `OnDestroy` + manual `unsubscribe()` patterns. No bare `.subscribe()` without teardown.

### Routing — reactive params

Never read route parameters via `route.snapshot.paramMap` inside components that can be
navigated to from sibling routes. Always use the `paramMap` Observable with `switchMap`:

```ts
this.route.paramMap.pipe(
  map(params => params.get('isbn')),
  filter(Boolean),
  switchMap(isbn => this.bookApiClient.getBook(isbn)),
  takeUntilDestroyed(this.destroyRef)
).subscribe(…);
```

### HTTP errors — interceptor owns toasts

`HttpErrorInterceptor` (`src/app/shared/http-error.interceptor.ts`) is registered globally
and shows the user-facing toast for every HTTP failure. Component error handlers must only
update local state (`loading = false`, `error = '…'`) — they must not call `ToastService`
directly for HTTP errors.

### External URLs — environment files

No URL, hostname, or port number may appear as a string literal inside a service or component.
All external endpoints must come from `environment.*`:

```ts
// src/environments/environment.ts
export const environment = { production: false, apiUrl: 'http://localhost:4730' };
```

### Interfaces — match the API

Interface fields must reflect what the API actually returns. If a field is sometimes absent,
mark it optional:

```ts
cover?: string;    // not required — some books have no cover
abstract?: string; // not required — some books have no abstract
```

### Component extraction — no duplication

Any template block that appears in more than one component must be extracted into its own
standalone component. The shared `BookCoverComponent` in `src/app/books/book-cover.component.ts`
is the canonical example.

### Imports — precise, not broad

Import only the directives a component actually uses. Never import `RouterModule` when only
`RouterLink` is needed:

```ts
// correct
imports: [RouterLink]

// wrong — pulls in unused directives
imports: [RouterModule]
```
