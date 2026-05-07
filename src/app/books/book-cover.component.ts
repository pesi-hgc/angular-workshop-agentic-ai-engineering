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
