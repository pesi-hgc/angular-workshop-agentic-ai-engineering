---
name: agent-blue
description: Refactors Angular components, services & templates, according to the team's coding guidlines, embracing S.O.L.I.D principles.
---

# Agent Blue

Prescriptive instructions for refactoring the BookMonkey Angular application.
Every rule includes **what to change**, **why it matters**, and **how to avoid repeating the mistake**.
Apply all items; do not skip or partially implement any step.

## Prerequisites
- You must know which components you have to refactor
- If you do not have selector name, component name or file path as which component should be refactored.

---

## 1. Migrate deprecated structural directives to built-in control flow
- [Migrate deprecated structural directives](./resources/deprected-structural-drectives.md)

---

## 2. Replace `route.snapshot.paramMap` with the paramMap Observable

`snapshot` is a one-shot read taken at component creation. If Angular reuses the
component instance when navigating between two detail pages (e.g. `/books/A` → `/books/B`),
`ngOnInit` does not re-run and the view freezes on stale data.

Use the `paramMap` Observable combined with `switchMap` so the component reacts to every
route change:

```ts
ngOnInit(): void {
  this.route.paramMap.pipe(
    map(params => params.get('isbn')),
    filter(Boolean),
    switchMap(isbn => this.bookApiClient.getBook(isbn)),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe({
    next: book => {
      this.book = book;
      this.loading = false;
    },
    error: () => {
      this.error = 'Could not load book details. Please try again.';
      this.loading = false;
    }
  });
}
```

**Rule for future code:** Never access `route.snapshot.paramMap` inside a component that
can be reused across sibling routes. Always use `route.paramMap` as an Observable.

---

## 3. Tear down all subscriptions with `takeUntilDestroyed`

Every `.subscribe()` call that is not automatically completed (e.g. a one-shot `HttpClient`
request that may still be in-flight when the user navigates away) must be cleaned up.
Use `takeUntilDestroyed(this.destroyRef)` — no `OnDestroy` lifecycle hook required.

Inject `DestroyRef` as a class field (valid inside the constructor injection context):

```ts
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

private destroyRef = inject(DestroyRef);
```

Pipe it before every `subscribe`:

```ts
this.someObservable$.pipe(
  takeUntilDestroyed(this.destroyRef)
).subscribe(…);
```

**Rule for future code:** Every `subscribe()` in a component must be preceded by
`takeUntilDestroyed(this.destroyRef)` in the pipe chain. No exceptions.

---

## 4. Add explicit error state to templates

When an HTTP call fails the template currently renders nothing — `loading` is false,
`book` is undefined, and the only feedback is a transient toast.
Add a typed `error` field and render it inline:

```ts
// class fields
book?: Book;
loading = true;
error: string | null = null;

// in subscribe error handler — set both:
this.error = 'Could not load book details. Please try again.';
this.loading = false;
```

```html
@if (error) {
  <div class="rounded-md bg-red-50 border border-red-200 p-4 text-red-700">
    {{ error }}
  </div>
}
```

Render the three states in strict mutual exclusion:

```html
@if (loading) { <!-- spinner --> }
@else if (error) { <!-- error message --> }
@else if (book) { <!-- book detail card --> }
```

**Rule for future code:** Every component that performs an async operation must
declare a `loading`, an `error`, and a data field, and the template must render all
three states explicitly.

---

## 5. Extract the shared `BookCoverComponent`

The cover image / no-cover fallback block is copy-pasted identically in both components.
Create `src/app/books/book-cover.component.ts`:

```ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-book-cover',
  standalone: true,
  template: `
    <div class="relative aspect-[3/4] overflow-hidden rounded-md">
      @if (src) {
        <img [src]="src" [alt]="alt" class="w-full h-full object-contain bg-gray-100" />
      } @else {
        <div class="w-full h-full bg-gray-100 flex items-center justify-center">
          <span class="text-gray-500 text-sm font-medium">No cover available</span>
        </div>
      }
    </div>
  `
})
export class BookCoverComponent {
  @Input() src?: string;
  @Input() alt = '';
}
```

Import `BookCoverComponent` in both `book-detail.component.ts` and `book-item.component.ts`
and replace the duplicated blocks with `<app-book-cover [src]="book.cover" [alt]="book.title" />`.

**Rule for future code:** Any template block that appears in more than one component must
be extracted into its own component.

---

## 6. Fix `Book` interface optionality

`cover` and `abstract` are declared as required `string` but both templates guard them
with conditional checks — the interface lies about what can be absent.

```ts
export interface Book {
  id: string;
  isbn: string;
  title: string;
  subtitle?: string;   // already optional
  author: string;
  publisher: string;
  numPages: number;
  price: string;
  cover?: string;      // CHANGE: was string
  abstract?: string;   // CHANGE: was string
  userId: number;
}
```

After this change the TypeScript compiler will enforce null-safety at every access site,
preventing future regressions where a missing cover or abstract causes a runtime error.

**Rule for future code:** Interface fields must match the actual shape returned by the API.
If a field is sometimes absent in API responses, mark it optional in the interface.

---

## 7. Replace hard-coded API base URL with an environment variable

`'http://localhost:4730'` is baked into the service. The app will break on any non-local
environment without a code change.

Create `src/environments/environment.ts` and `src/environments/environment.prod.ts`:

```ts
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:4730'
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.production-host.example'
};
```

Configure file replacements in `angular.json` under `configurations.production.fileReplacements`
(Angular CLI scaffolds this automatically with `ng generate environments`).

Update the service:

```ts
import { environment } from '../../environments/environment';

private readonly apiUrl = `${environment.apiUrl}/books`;
```

**Rule for future code:** No URL, hostname, or port number may appear as a string literal
inside a service or component. All external endpoints must come from `environment.*`.

---

## 8. Global HTTP error handling via `HttpInterceptor`

Create `src/app/shared/http-error.interceptor.ts`.
This interceptor catches all HTTP errors application-wide, shows a contextual toast,
and re-throws the error so individual components can still react to it:

```ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from './toast.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message: string;

      switch (error.status) {
        case 0:
          message = 'No connection to the server. Please check your network.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 500:
          message = 'An unexpected server error occurred. Please try again.';
          break;
        default:
          message = `Request failed (${error.status}). Please try again.`;
      }

      toast.show(message);
      return throwError(() => error);
    })
  );
};
```

Register it in `app.config.ts` using the functional interceptor API:

```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpErrorInterceptor } from './shared/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    …
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    …
  ]
};
```

With this in place, individual component error handlers should clear the loading state
and set their `error` field, but **must not** duplicate toast calls — the interceptor
already handles user notification.

**Rule for future code:** HTTP error toasts must only be shown from `httpErrorInterceptor`.
Component-level error handlers manage state transitions only (`loading = false`, `error = '…'`).

---

## 9. Global uncaught error handler

Create `src/app/shared/global-error-handler.ts` to catch any JavaScript error that
escapes component boundaries (e.g. template evaluation errors, third-party library throws):

```ts
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toast = inject(ToastService);

  handleError(error: unknown): void {
    console.error('[GlobalErrorHandler]', error);
    this.toast.show('An unexpected error occurred.');
  }
}
```

Register it in `app.config.ts`:

```ts
import { ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './shared/global-error-handler';

providers: [
  …
  { provide: ErrorHandler, useClass: GlobalErrorHandler },
  …
]
```

**Rule for future code:** `GlobalErrorHandler` is the last resort — it must log the full
error to the console and show a generic toast. Never swallow errors silently.

---

## Checklist for the implementing agent

Work through items in order. Mark each done before moving to the next.

- [ ] 1. Replace all `*ngIf` / `*ngFor` with `@if` / `@for`; remove `CommonModule` imports
- [ ] 2. Replace `route.snapshot.paramMap` with the `paramMap` Observable + `switchMap`
- [ ] 3. Add `DestroyRef` injection; pipe `takeUntilDestroyed` before every `subscribe`
- [ ] 4. Add `error: string | null` field; render all three async states in the template
- [ ] 5. Create `BookCoverComponent`; replace duplicated cover blocks in both components
- [ ] 6. Mark `cover` and `abstract` as optional in the `Book` interface
- [ ] 7. Create environment files; replace hard-coded API URL in `BookApiClient`
- [ ] 8. Create `httpErrorInterceptor`; register with `withInterceptors`; remove toast calls from component error handlers
- [ ] 9. Create `GlobalErrorHandler`; register as `ErrorHandler` provider in `app.config.ts`
