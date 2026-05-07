import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Book } from './book';

export const PAGE_SIZE = 12;

export interface BookPage {
  books: Book[];
  total: number;
}

export interface GetBooksArgs {
  page: number;
  pageSize: number;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class BookApiClient {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/books`;

  getBooks(args: GetBooksArgs): Observable<BookPage> {
    let params = new HttpParams()
      .set('_page', String(args.page))
      .set('_limit', String(args.pageSize));

    if (args.search) {
      params = params.set('q', args.search);
    }

    return this.http
      .get<Book[]>(this.apiUrl, { params, observe: 'response' })
      .pipe(
        map(response => ({
          books: response.body ?? [],
          total: Number(response.headers.get('X-Total-Count') ?? response.body?.length ?? 0)
        }))
      );
  }

  getBook(isbn: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${isbn}`);
  }
}
