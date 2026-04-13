import { Injectable, signal } from '@angular/core';

export type AppLanguage = 'en' | 'ru';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly languageOptions: readonly AppLanguage[] = ['en', 'ru'];
  readonly languageLabels: Record<AppLanguage, string> = {
    en: 'EN',
    ru: 'RU',
  };

  private readonly storageKey = 'greenfind.main.language';
  readonly currentLanguage = signal<AppLanguage>('en');

  constructor() {
    this.currentLanguage.set(this.detectInitialLanguage());
  }

  setLanguage(language: AppLanguage): void {
    if (this.currentLanguage() === language) return;
    this.currentLanguage.set(language);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, language);
    }
  }

  private detectInitialLanguage(): AppLanguage {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.storageKey);
      if (stored === 'en' || stored === 'ru') return stored;
    }

    if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ru')) {
      return 'ru';
    }

    return 'en';
  }
}
