import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ToastService } from '../shared/toast.service';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

      <div *ngIf="loading" class="flex justify-center items-center py-20">
        <div class="animate-pulse flex flex-col items-center">
          <div
            class="h-16 w-16 rounded-full border-4 border-t-blue-700 border-r-blue-700 border-b-gray-200 border-l-gray-200 animate-spin"
          ></div>
          <p class="mt-4 text-gray-600">Loading book...</p>
        </div>
      </div>

      <div *ngIf="!loading && book" class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="md:grid md:grid-cols-[1fr_2fr] md:gap-8 p-6">
          <div class="relative aspect-[3/4] overflow-hidden rounded-md mb-6 md:mb-0">
            <img
              *ngIf="book.cover"
              [src]="book.cover"
              [alt]="book.title"
              class="w-full h-full object-contain bg-gray-100"
            />
            <div
              *ngIf="!book.cover"
              class="w-full h-full bg-gray-100 flex items-center justify-center"
            >
              <span class="text-gray-500 text-sm font-medium">No cover available</span>
            </div>
          </div>

          <div class="flex flex-col">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">{{ book.title }}</h1>
            <p *ngIf="book.subtitle" class="text-lg text-gray-600 mb-4">{{ book.subtitle }}</p>

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

            <div *ngIf="book.abstract" class="border-t border-gray-200 pt-4">
              <h2 class="text-sm font-medium text-gray-500 mb-2">Abstract</h2>
              <p class="text-gray-700 leading-relaxed whitespace-pre-line">{{ book.abstract }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BookDetailComponent implements OnInit {
  book?: Book;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private bookApiClient: BookApiClient,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const isbn = this.route.snapshot.paramMap.get('isbn');
    if (!isbn) {
      this.loading = false;
      this.toastService.show('Book not found');
      return;
    }

    this.bookApiClient.getBook(isbn).subscribe({
      next: book => {
        this.book = book;
        this.loading = false;
      },
      error: error => {
        console.error('Error fetching book:', error);
        this.loading = false;
        this.toastService.show('Book not found');
      }
    });
  }
}
