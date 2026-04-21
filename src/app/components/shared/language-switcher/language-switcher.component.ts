import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AppLanguage, LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex items-center gap-1 rounded-2xl border border-white/15 bg-black/25 p-1 backdrop-blur-2xl"
    >
      <button
        *ngFor="let language of languageOptions"
        type="button"
        (click)="setLanguage(language)"
        class="h-9 w-10 rounded-xl text-[11px] font-black tracking-[0.14em] transition-all"
        [ngClass]="
          selectedLanguage === language
            ? 'bg-white/20 text-white'
            : 'text-white/55 hover:text-white hover:bg-white/10'
        "
      >
        {{ languageLabels[language] }}
      </button>
    </div>
  `,
})
export class LanguageSwitcherComponent {
  private readonly language = inject(LanguageService);
  readonly languageOptions = this.language.languageOptions;
  readonly languageLabels = this.language.languageLabels;

  get selectedLanguage(): AppLanguage {
    return this.language.currentLanguage();
  }

  setLanguage(language: AppLanguage): void {
    this.language.setLanguage(language);
  }
}
