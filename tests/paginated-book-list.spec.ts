import { test, expect, Route } from '@playwright/test';

const APP_URL = 'http://localhost:4200/';
const API_URL = 'http://localhost:4730/books**';

const TOTAL_BOOKS = 137;
const PAGE_SIZE = 12;

function makeBooks(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i + 1}`,
    isbn: `isbn-${i + 1}`,
    title: `Title ${i + 1}`,
    author: `Author ${i + 1}`,
    publisher: `Publisher ${i + 1}`,
    numPages: 100 + i,
    price: '9.99',
    userId: 1
  }));
}

test.describe('Feature: Paginated Book List', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Total-Count': String(TOTAL_BOOKS),
          'Access-Control-Expose-Headers': 'X-Total-Count'
        },
        body: JSON.stringify(makeBooks(PAGE_SIZE))
      });
    });
  });

  test('given the user opens "/" when the list loads then 12 books and a "Showing 1–12 of 137 books" indicator are visible', async ({
    page
  }) => {
    // Given
    await page.goto(APP_URL);

    // When — the list finishes loading (spinner gone)
    await expect(page.getByText('Loading books...')).toBeHidden();

    // Then — exactly 12 book cards are rendered
    // NOTE: the developer should add `data-testid="book-card"` to the book item
    // template when implementing this feature.
    const cards = page.getByTestId('book-card');
    await expect(cards).toHaveCount(PAGE_SIZE);

    // Then — pagination indicator is visible (accept en-dash or hyphen between range numbers)
    await expect(page.getByText(/Showing\s+1\s*[–-]\s*12\s+of\s+137\s+books/)).toBeVisible();
  });
});
