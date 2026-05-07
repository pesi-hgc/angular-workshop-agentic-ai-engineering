Replace every `*ngIf` / `*ngFor` with the Angular 17+ built-in control flow syntax.
After migration, remove `CommonModule` from every `imports` array — it is no longer needed.

```html
<!-- BEFORE -->
<div *ngIf="loading">…</div>
<div *ngIf="!loading && book">…</div>
<app-book-item *ngFor="let book of books; trackBy: trackById" [book]="book" />

<!-- AFTER -->
@if (loading) { <div>…</div> }
@if (!loading && book) { <div>…</div> }
@for (book of books; track book.id) { <app-book-item [book]="book" /> }
```

`@for` requires a `track` expression — use a unique field (`book.id`), never `$index`.
The `trackById` method in `BookListComponent` can be deleted after migration.

**Rule for future code:** Never write `*ngIf` or `*ngFor` in this project. Always use `@if` / `@for` / `@else`.