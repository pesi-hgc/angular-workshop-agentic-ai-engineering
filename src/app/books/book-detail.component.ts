import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, map, switchMap } from 'rxjs/operators';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';
import { BookCoverComponent } from './book-cover.component';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [RouterLink, BookCoverComponent],
  template: `
    <div class="container mx-auto px-4 py-12 max-w-5xl">
      <a
        routerLink="/"
        class="inline-flex items-center text-blue-700 hover:text-blue-900 mb-6 font-medium"
      >
        <svg class="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        Back to list
      </a>

      @if (loading) {
        <div class="flex justify-center items-center py-20">
          <div class="animate-pulse flex flex-col items-center">
            <div
              class="h-16 w-16 rounded-full border-4 border-t-blue-700 border-r-blue-700 border-b-gray-200 border-l-gray-200 animate-spin"
            ></div>
            <p class="mt-4 text-gray-600">Loading book...</p>
          </div>
        </div>
      } @else if (error) {
        <div class="rounded-md bg-red-50 border border-red-200 p-4 text-red-700">
          {{ error }}
        </div>
      } @else if (book) {
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="md:grid md:grid-cols-[1fr_2fr] md:gap-8 p-6">
            <div class="mb-6 md:mb-0">
              <app-book-cover [src]="book.cover" [alt]="book.title" />
            </div>

            <div class="flex flex-col">
              <h1 class="text-3xl font-bold text-gray-800 mb-2">{{ book.title }}</h1>
              @if (book.subtitle) {
                <p class="text-lg text-gray-600 mb-4">{{ book.subtitle }}</p>
              }

              <p class="text-blue-700 text-lg font-medium mb-4">{{ book.author }}</p>

              <dl class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm text-gray-700 mb-6">
                <dt class="font-medium text-gray-500">Publisher</dt>
                <dd>{{ book.publisher }}</dd>

                <dt class="font-medium text-gray-500">ISBN</dt>
                <dd>{{ book.isbn }}</dd>

                <dt class="font-medium text-gray-500">Pages</dt>
                <dd>{{ book.numPages }}</dd>

                <dt class="font-medium text-gray-500">Price</dt>
                <dd>{{ book.price }}</dd>
              </dl>

              @if (book.abstract) {
                <div class="border-t border-gray-200 pt-4">
                  <h2 class="text-sm font-medium text-gray-500 mb-2">Abstract</h2>
                  <p class="text-gray-700 leading-relaxed whitespace-pre-line">{{ book.abstract }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class BookDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly bookApiClient = inject(BookApiClient);
  private readonly destroyRef = inject(DestroyRef);

  book?: Book;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => params.get('isbn')),
        filter((isbn): isbn is string => !!isbn),
        switchMap(isbn => {
          this.loading = true;
          this.error = null;
          return this.bookApiClient.getBook(isbn);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
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
}
