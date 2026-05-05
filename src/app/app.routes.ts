import { Routes } from '@angular/router';
import { BookDetailComponent } from './books/book-detail.component';
import { BookListComponent } from './books/book-list.component';

export const routes: Routes = [
  { path: '', component: BookListComponent },
  { path: 'books/:isbn', component: BookDetailComponent },
  { path: '**', redirectTo: '' }
];
