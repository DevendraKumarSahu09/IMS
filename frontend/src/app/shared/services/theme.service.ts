import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme === 'dark' || (!savedTheme && prefersDark);
    this.setTheme(initialTheme);
  }

  toggleTheme(): void {
    const currentTheme = this.isDarkModeSubject.value;
    this.setTheme(!currentTheme);
  }

  setTheme(isDark: boolean): void {
    this.isDarkModeSubject.next(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  getCurrentTheme(): boolean {
    return this.isDarkModeSubject.value;
  }
}
