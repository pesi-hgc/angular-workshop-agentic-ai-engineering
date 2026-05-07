# Architecture Overview

This document serves as a critical, living template designed to equip agents with a rapid and comprehensive understanding of the codebase's architecture, enabling efficient navigation and effective contribution from day one. Update this document as the codebase evolves.

> **TL;DR** — This repository is a **standalone Angular 20 single-page application** ("BookMonkey") used as the teaching artifact for an Angular + Agentic AI workshop. It has **no backend code of its own**: it talks to the externally-installed [`bookmonkey-api`](https://www.npmjs.com/package/bookmonkey-api) mock REST server. Treat the project as *frontend-only* when navigating.

## 1. Project Structure

```
angular-workshop-agentic-ai-engineering/
├── src/
│   ├── app/
│   │   ├── books/                          # Feature module: book browsing
│   │   │   ├── book.ts                     # Book interface (domain model)
│   │   │   ├── book-api-client.service.ts  # HttpClient wrapper for bookmonkey-api
│   │   │   ├── book-list.component.ts      # Route "/" – grid + search
│   │   │   ├── book-item.component.ts      # Card; routerLink to detail
│   │   │   └── book-detail.component.ts    # Route "/books/:isbn"
│   │   ├── shared/
│   │   │   └── toast.service.ts            # MatSnackBar wrapper
│   │   ├── app.ts                          # Root standalone component
│   │   ├── app.html / app.css              # Header + <router-outlet> + footer
│   │   ├── app.config.ts                   # ApplicationConfig (DI providers)
│   │   └── app.routes.ts                   # Route table
│   ├── main.ts                             # bootstrapApplication(App, appConfig)
│   ├── index.html                          # Shell HTML
│   ├── styles.css                          # Global styles + Tailwind v4 directives
│   └── material-theme.scss                 # Angular Material theme tokens
├── public/                                 # Static assets copied verbatim (favicon, etc.)
├── tests/                                  # Playwright E2E specs
│   └── example.spec.ts
├── tests-examples/                         # Reference Playwright examples (not run)
├── docs/                                   # Workshop-related images
├── playwright.config.ts                    # Playwright runner config
├── angular.json                            # Angular CLI workspace config
├── tsconfig*.json                          # Strict + strictTemplates enabled
├── .postcssrc.json / .prettierrc           # Tailwind v4 PostCSS plugin + formatter
├── package.json                            # Scripts & deps
├── README.md                               # Quick start
└── ARCHITECTURE.md                         # This document
```

There is **no `backend/`, `common/`, or `scripts/` directory** — the SPA is the entire codebase.

## 2. High-Level System Diagram

```
┌──────────┐    HTTPS/HTTP     ┌──────────────────────────┐    REST/JSON     ┌────────────────────────┐
│  Browser │  ────────────►    │  Angular SPA (this repo) │  ─────────────►  │  bookmonkey-api        │
│  (User)  │  ◄────────────    │  served by `ng serve`    │  ◄─────────────  │  (npx, localhost:4730) │
└──────────┘                   └──────────────────────────┘                  └────────────────────────┘
                                          │
                                          └── Tailwind CSS, Angular Material (UI only, in-browser)
```

- The Angular dev server (`ng serve`) hosts the SPA on `http://localhost:4200`.
- All data comes from `http://localhost:4730/books` exposed by the separately-installed `bookmonkey-api` mock server.
- There is **no auth, no DB, no message broker, no inter-service traffic**.

## 3. Core Components

### 3.1. Frontend

- **Name:** BookMonkey SPA
- **Description:** A teaching application that browses a collection of books. The user lands on a paginated, searchable list (`/`) and can click a card to view the full metadata of a single book at `/books/:isbn`. UI feedback (errors, etc.) is surfaced via snackbar toasts.
- **Technologies:**
  - Angular 20.2.x (standalone components, no NgModules)
  - TypeScript 5.9 with `strict` + `strictTemplates`
  - RxJS 7.8 for async (`Observable.subscribe`)
  - Tailwind CSS 4.1 (via `@tailwindcss/postcss`)
  - Angular Material 20.2 (currently only `MatSnackBar`)
  - Zone.js change detection (`provideZoneChangeDetection({ eventCoalescing: true })`)
- **Deployment:** Not deployed. Runs locally via `npm start` (`ng serve` → `http://localhost:4200`). SSR packages (`@angular/ssr`, `@angular/platform-server`, `express`) are installed for future SSR exercises but **no `server.ts` is wired up yet** — the production build is browser-only.

### 3.2. Backend Services

#### 3.2.1. bookmonkey-api (external)

- **Name:** Bookmonkey Mock API
- **Description:** Read-only mock REST API providing the book catalog. Started independently with `npx bookmonkey-api`. Endpoints:
  - `GET /books?_limit=N&q=term` → `Book[]` (used by `BookListComponent`)
  - `GET /books/:isbn` → `Book` (used by `BookDetailComponent`)
- **Technologies:** Node.js (json-server-style). Owned by [workshops.de](https://workshops.de), **not** part of this repository.
- **Deployment:** Local process on port `4730`.

There are **no first-party backend services**.

## 4. Data Stores

The SPA does **not own any persistent storage**. All state is either:

- In-memory component state (e.g. `BookListComponent.books`, `BookDetailComponent.book`)
- Fetched on demand from the external bookmonkey-api

### 4.1. (External) Bookmonkey API in-memory store

- **Type:** json-server flat file inside the `bookmonkey-api` npm package
- **Purpose:** Provides deterministic fake data for the workshop
- **Key collections:** `books` (fields: `id`, `isbn`, `title`, `subtitle?`, `author`, `publisher`, `numPages`, `price`, `cover`, `abstract`, `userId` — see [src/app/books/book.ts](src/app/books/book.ts))

No browser storage (`localStorage`, `IndexedDB`, cookies) is used.

## 5. External Integrations / APIs

| Service Name      | Purpose                                       | Integration Method                                         |
| ----------------- | --------------------------------------------- | ---------------------------------------------------------- |
| **bookmonkey-api** | Source of all book data                      | REST via Angular `HttpClient` ([book-api-client.service.ts](src/app/books/book-api-client.service.ts)) |

No third-party SaaS integrations (Stripe, SendGrid, analytics, etc.).

## 6. Deployment & Infrastructure

- **Cloud Provider:** None. The project runs locally on the developer's machine.
- **Key Services Used:** Angular CLI dev server (`@angular/build:dev-server`), bookmonkey-api Node process.
- **CI/CD Pipeline:** None configured. There is no `.github/workflows/`, `.gitlab-ci.yml`, or equivalent.
- **Monitoring & Logging:** None. Errors are logged to the browser console (`console.error`) and surfaced to the user via `ToastService.show(...)`.

## 7. Security Considerations

This is a workshop / learning project with **no security surface to defend**:

- **Authentication:** None. The bookmonkey-api requires no credentials.
- **Authorization:** None.
- **Data Encryption:** None (everything is `http://localhost`).
- **Key Security Tools/Practices:** N/A. **Do not deploy this app or the mock API to a public network without adding auth, HTTPS, and input validation.**

## 8. Development & Testing Environment

### Local Setup

1. `npm install` — install Angular and dev tooling
2. In a second terminal: `npx bookmonkey-api` — start the mock API on `:4730`
3. `npm start` — start the Angular dev server on `:4200`

(See [README.md](README.md) for the canonical quick start.)

### Available scripts

| Script              | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `npm start`         | `ng serve` — dev server with HMR                           |
| `npm run build`     | Production build (`ng build`) — must pass strict templates |
| `npm run watch`     | Incremental dev build                                      |
| `npm test`          | `ng test` — Karma + Jasmine (no specs exist yet)           |
| `npm run format.write` | Prettier on all `src/**/*.{ts,html,md,css,json}`        |
| `npx playwright test` | Run Playwright E2E specs in `tests/`                     |

### Testing Frameworks

- **Karma + Jasmine** — unit-test runner is configured in [angular.json](angular.json) but `src/` currently contains **no `*.spec.ts` files**.
- **Playwright** — E2E setup in [playwright.config.ts](playwright.config.ts); `webServer` boots `npm start` automatically; runs against Chromium, Firefox, and WebKit. Only an `example.spec.ts` ships today.

### Code Quality Tools

- **Prettier** ([.prettierrc](.prettierrc)) — sole formatter
- **TypeScript strict mode** + Angular `strictTemplates` (see [tsconfig.json](tsconfig.json)) — these are the only static-analysis gates; **no ESLint is configured.**

## 9. Future Considerations / Roadmap

Items present in `package.json` but **not yet wired into source code** — likely workshop exercises:

- **State management with `@ngrx/signals` and `@angular-architects/ngrx-toolkit`** — installed but unused; current code uses plain `subscribe()`.
- **Server data caching with `@tanstack/angular-query-experimental`** — installed but unused; no `provideTanstackQuery` in [app.config.ts](src/app/app.config.ts).
- **SSR via `@angular/ssr` + `express`** — packages installed; `server.ts` is **not present** and the build target is browser-only.
- **Test coverage** — both Karma and Playwright are configured but only ship example/empty specs.
- **CI/CD** — no pipeline; recently committed `chore: initialize playwright` suggests an E2E pipeline is the natural next step.
- **Edit / create / delete book flows** — recent commit `chore: reset edit and detail feature` removed earlier scaffolding; expect these to be re-introduced as workshop steps.

## 10. Project Identification

- **Project Name:** Modern Angular Workshop — BookMonkey (`angular-workshop-modern` in [package.json](package.json))
- **Repository URL:** Local workshop checkout — see [workshops.de Angular + Agentic AI seminar](https://workshops.de/seminare-schulungen-kurse/angular-ai-agent-driven-development) for the upstream
- **Primary Contact/Team:** workshops.de (workshop authors); local maintainer: `Peter` (git user)
- **Date of Last Update:** 2026-05-05

## 11. Glossary / Acronyms

| Term / Acronym         | Meaning                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **SPA**                | Single-Page Application — the Angular app shipped here                                         |
| **SSR**                | Server-Side Rendering — installed (`@angular/ssr`) but not yet activated                       |
| **ISBN**               | International Standard Book Number — used as the URL key in `/books/:isbn`                     |
| **HMR**                | Hot Module Replacement — provided by `ng serve`                                                |
| **DI**                 | Dependency Injection — Angular's `providedIn: 'root'` and `ApplicationConfig` providers        |
| **bookmonkey-api**     | The external mock REST server (`npx bookmonkey-api`) — the only data source                    |
| **standalone component** | Angular 14+ component declared with `standalone: true`; no NgModule required                 |
| **strictTemplates**    | Angular compiler option that type-checks template bindings against component types             |
| **MatSnackBar**        | Angular Material toast/notification component, wrapped here by `ToastService`                  |
| **Mandator**           | (From sibling enterprise codebase, **not** used in this repo) — multi-tenant key. Ignore here. |
