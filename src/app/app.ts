import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeToggleComponent } from './shared/theme-toggle.component';
import { ThemeService } from './shared/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThemeToggleComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'BookMonkey';
  // Eagerly instantiate ThemeService so the persisted theme is applied on bootstrap.
  private readonly themeService = inject(ThemeService);
}
