import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="theme-toggle inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.aria-pressed]="themeService.isDark()"
      (click)="themeService.toggle()"
    >
      @if (themeService.isDark()) {
        <span aria-hidden="true">☀️</span>
      } @else {
        <span aria-hidden="true">🌙</span>
      }
    </button>
  `
})
export class ThemeToggleComponent {
  protected readonly themeService = inject(ThemeService);
}
