# 1 — Paginated Book List

## User Story

```
As a visitor browsing the BookMonkey collection
I want the book list to load a small page of results at a time with numbered pagination
So that I can navigate the full collection without waiting for hundreds of books to load at once
```

## Acceptance Criteria

### Page rendering & data loading

- [ ] Given the user opens `/`, when the list loads, then exactly **12 books** are fetched and rendered.
- [ ] Given the API responds successfully, when the page is rendered, then a "Showing X–Y of Z books" indicator is visible above or below the grid.
- [ ] Given the API request fails, when the response errors, then the existing error state renders and pagination controls are hidden.
- [ ] Given the API request is in flight, when results have not yet returned, then the existing loading spinner is shown and pagination controls are hidden.

### Pagination controls

- [ ] Given there is more than one page, when the list renders, then numbered page buttons (« 1 2 3 … N ») are visible.
- [ ] Given the user is on page 1, when the list renders, then the « / Prev control is disabled.
- [ ] Given the user is on the last page, when the list renders, then the » / Next control is disabled.
- [ ] Given the user clicks a page number, when the click is handled, then the list scrolls to the top of the grid and the new page is fetched.
- [ ] Given there are more than ~7 pages, when the controls render, then an ellipsis (`…`) collapses the middle range so the bar stays compact.

### URL deep linking

- [ ] Given the user navigates to `/?page=3`, when the component initializes, then page 3 is fetched and rendered.
- [ ] Given the user changes page, when the new page loads, then the URL query params (`page`, `q`) are updated **without** a full navigation (use `Router.navigate` with `queryParamsHandling: 'merge'` or `Location.replaceState`).
- [ ] Given the user reloads the browser, when the app boots, then the same page and search term are restored from the URL.
- [ ] Given an invalid `page` param (e.g. `0`, `abc`, beyond the last page), when read, then it falls back to page 1.

### Search interaction

- [ ] Given the user types in the search box, when the 300 ms debounce fires, then the request is sent with `q=<term>` **and** `page=1`.
- [ ] Given a search is active, when results paginate, then the `q` query param remains in the URL alongside `page`.
- [ ] Given the user clears the search, when the input is empty, then the list returns to the unfiltered first page.

## Technical Advice

### API

- The `bookmonkey-api` is json-server based and supports `_page` and `_limit` query params, plus `q` for full-text search.
- Total count comes back in the `X-Total-Count` **response header**. Update `BookApiClient.getBooks` to:
  - accept `{ page, pageSize, search }`
  - request with `observe: 'response'` so headers are accessible
  - return `Observable<{ books: Book[]; total: number }>` (or similar)
- Add a constant `PAGE_SIZE = 12` — do not pass page size from the component for this iteration (keep the surface small; can be widened later if a size-picker is added).

### CORS caveat

`X-Total-Count` is a **non-simple** header. json-server exposes it by default, but if a CORS issue surfaces, the API config may need `Access-Control-Expose-Headers: X-Total-Count`. Verify this in the browser network tab during implementation.

### Routing / URL sync

- Inject `ActivatedRoute` and read `queryParamMap` (Observable) — **not** `snapshot` — so back/forward navigation works.
- Use `switchMap` so an in-flight request is cancelled when the user clicks a new page rapidly.
- Pair every `subscribe()` with `takeUntilDestroyed(this.destroyRef)` per the project's coding rules.

### Component structure

- Extract the pagination bar into its own standalone component, e.g. `PaginationComponent` in [src/app/shared/pagination.component.ts](src/app/shared/pagination.component.ts), with `@Input() currentPage`, `@Input() totalPages`, `@Output() pageChange`. Reusable for any future paginated list (authors, etc.).
- Keep `BookListComponent` orchestrating: it owns the URL ↔ data binding, hands `currentPage` / `totalPages` to the pagination component, and reacts to `pageChange`.

### Edge cases to watch

- Empty result set (search with no matches): hide pagination, show the existing empty state.
- Last page partially filled (e.g. 137 books / 12 per page → page 12 has 5 books): grid must not stretch; existing Tailwind grid handles this.
- Race condition: rapid page clicks must not display stale results — `switchMap` solves this.
- Search debounce currently uses `setTimeout`; consider moving search input to a reactive form (`FormControl` + `valueChanges.pipe(debounceTime(300), distinctUntilChanged())`) for cleaner integration with the URL-sync pipeline. Optional but cleaner.

### Out of scope (this iteration)

- User-selectable page size dropdown
- Sorting / filtering by genre / author
- `@tanstack/angular-query-experimental` adoption (kept as a separate workshop step)
- Server-side caching strategy
- Prefetching the next page

## Open Questions

- None — running with confirmed defaults: numbered pages, fixed 12/page, total count visible, URL-synced, search resets to page 1.
