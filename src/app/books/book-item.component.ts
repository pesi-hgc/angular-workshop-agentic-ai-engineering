import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book } from './book';
import { BookCoverComponent } from './book-cover.component';

@Component({
  selector: 'app-book-item',
  standalone: true,
  imports: [RouterLink, BookCoverComponent],
  template: `
    <div
      data-testid="book-card"
      [routerLink]="['/books', book.isbn]"
      class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full cursor-pointer"
    >
      <app-book-cover [src]="book.cover" [alt]="book.title" />
      <div class="p-5 flex flex-col flex-grow">
        <h2 class="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">{{ book.title }}</h2>
        @if (book.subtitle) {
          <p class="text-sm text-gray-600 mb-2 line-clamp-2">{{ book.subtitle }}</p>
        }
        <div class="text-sm text-gray-700 mt-auto">
          <p>
            <span class="text-blue-700">{{ book.author }}</span>
          </p>
          @if (book.isbn) {
            <p class="text-xs text-gray-500 mt-2">ISBN: {{ book.isbn }}</p>
          }
        </div>
      </div>
    </div>
  `
})
export class BookItemComponent {
  @Input() book!: Book;
}
