import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="toggleTheme()"
      class="relative inline-flex items-center justify-center w-12 h-12 rounded-xl glass-effect hover:shadow-glow transition-all duration-300 group"
      [class]="isDarkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-white/20'"
      [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <!-- Sun Icon (Light Mode) -->
      <svg
        *ngIf="!isDarkMode"
        class="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors duration-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      <!-- Moon Icon (Dark Mode) -->
      <svg
        *ngIf="isDarkMode"
        class="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors duration-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>

      <!-- Tooltip -->
      <div class="absolute -top-12 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-dark-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
      </div>
    </button>
  `,
  styles: []
})
export class ThemeToggleComponent implements OnInit {
  isDarkMode = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
