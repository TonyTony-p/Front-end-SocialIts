import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  isDark = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark.set(saved ? saved === 'dark' : prefersDark);
      this.apply();
    }
  }

  toggle(): void {
    this.isDark.update(v => !v);
    this.apply();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
    }
  }

  private apply(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
    }
  }
}
