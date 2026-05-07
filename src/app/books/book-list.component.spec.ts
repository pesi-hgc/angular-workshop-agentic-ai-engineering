import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';
import { BookListComponent } from './book-list.component';

function makeBook(id: number): Book {
  return {
    id: `id-${id}`,
    isbn: `isbn-${id}`,
    title: `Title ${id}`,
    author: `Author ${id}`,
    publisher: `Publisher ${id}`,
    numPages: 100 + id,
    price: '9.99',
    userId: 1
  };
}

describe('BookListComponent — paginated list (Feature 1)', () => {
  let fixture: ComponentFixture<BookListComponent>;
  let component: BookListComponent;
  let bookApiClient: jasmine.SpyObj<BookApiClient>;
  let twelveBooks: Book[];

  beforeEach(() => {
    twelveBooks = Array.from({ length: 12 }, (_, i) => makeBook(i + 1));

    bookApiClient = jasmine.createSpyObj<BookApiClient>('BookApiClient', ['getBooks', 'getBook']);
    // Target API contract per requirement: returns { books, total }
    bookApiClient.getBooks.and.returnValue(of({ books: twelveBooks, total: 137 } as any));

    TestBed.configureTestingModule({
      imports: [BookListComponent],
      providers: [provideRouter([]), { provide: BookApiClient, useValue: bookApiClient }]
    });

    fixture = TestBed.createComponent(BookListComponent);
    component = fixture.componentInstance;
  });

  it('given the user opens "/", when the list loads, then exactly 12 books are fetched', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(bookApiClient.getBooks).toHaveBeenCalledTimes(1);
    const arg = bookApiClient.getBooks.calls.mostRecent().args[0] as unknown as { page: number; pageSize: number };
    expect(arg.page).toBe(1);
    expect(arg.pageSize).toBe(12);
    expect(component.books.length).toBe(12);
  }));

  it('given the API responds successfully, when the page is rendered, then a "Showing 1–12 of 137 books" indicator is visible', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    // Accept either an en-dash or hyphen between the range numbers.
    expect(text).toMatch(/Showing\s+1\s*[–-]\s*12\s+of\s+137\s+books/);
  }));
});
