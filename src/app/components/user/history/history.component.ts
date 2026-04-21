import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService, SearchHistoryItem } from '../../../services/auth.service';
import { AppLanguage, LanguageService } from '../../../services/language.service';
import { SearchFilters, SearchService } from '../../../services/search.service';
import {
  ArrowLeftIcon,
  HistoryIcon,
  LucideAngularModule,
  Search,
  Trash2Icon,
  UserIcon,
  XIcon,
} from 'lucide-angular';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, LanguageSwitcherComponent],
  templateUrl: './history.component.html',
})
export class HistoryComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly ArrowLeftIcon = ArrowLeftIcon;
  readonly UserIcon = UserIcon;
  readonly HistoryIcon = HistoryIcon;
  readonly Trash2Icon = Trash2Icon;
  readonly XIcon = XIcon;

  private readonly auth = inject(AuthService);
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly language = inject(LanguageService);

  readonly loading = signal(true);
  readonly deletingAll = signal(false);
  readonly deletingIds = signal<Set<number>>(new Set());
  readonly error = signal<string | null>(null);
  readonly items = signal<HistoryViewItem[]>([]);
  readonly querySearch = signal('');
  readonly selectedDay = signal<'all' | string>('all');
  returnUrl = '/';
  private readonly translations: Record<AppLanguage, Record<string, string>> = {
    en: {
      backToSearch: 'Back to Search',
      myProfile: 'My Profile',
      history: 'History',
      searchesCount: 'searches',
      searchPlaceholder: 'Search history by title...',
      allDays: 'All days',
      reset: 'Reset',
      clearAll: 'Clear all',
      loadingHistory: 'Loading history...',
      noMatchingHistory: 'No matching history.',
      noMatchingHint: 'Try another search or day filter.',
      items: 'items',
      region: 'region',
      clicks: 'clicks',
      more: 'more',
      delete: 'Delete',
      failedLoad: 'Failed to load history',
      failedDelete: 'Failed to delete history item',
      failedClear: 'Failed to clear history',
      confirmDeleteAll: 'Delete all search history?',
      unknownDay: 'Unknown day',
      today: 'Today',
      yesterday: 'Yesterday',
    },
    ru: {
      backToSearch: 'Назад к поиску',
      myProfile: 'Мой профиль',
      history: 'История',
      searchesCount: 'поисков',
      searchPlaceholder: 'Поиск по истории...',
      allDays: 'Все дни',
      reset: 'Сброс',
      clearAll: 'Очистить всё',
      loadingHistory: 'Загрузка истории...',
      noMatchingHistory: 'Подходящая история не найдена.',
      noMatchingHint: 'Попробуйте другой запрос или фильтр по дню.',
      items: 'записей',
      region: 'регион',
      clicks: 'клики',
      more: 'ещё',
      delete: 'Удалить',
      failedLoad: 'Не удалось загрузить историю',
      failedDelete: 'Не удалось удалить запись истории',
      failedClear: 'Не удалось очистить историю',
      confirmDeleteAll: 'Удалить всю историю поиска?',
      unknownDay: 'Неизвестный день',
      today: 'Сегодня',
      yesterday: 'Вчера',
    },
  };

  get selectedLanguage(): AppLanguage {
    return this.language.currentLanguage();
  }

  setLanguage(language: AppLanguage): void {
    this.language.setLanguage(language);
  }

  t(key: string): string {
    return this.translations[this.selectedLanguage][key] ?? this.translations.en[key] ?? key;
  }

  readonly totalItems = computed(() => this.items().length);

  readonly dayOptions = computed(() => {
    const map = new Map<string, Date>();
    for (const item of this.items()) {
      if (!map.has(item.dayKey)) {
        map.set(item.dayKey, item.createdDate);
      }
    }

    return Array.from(map.entries())
      .sort((a, b) => b[1].getTime() - a[1].getTime())
      .map(([key, date]) => ({ key, label: this.formatDayLabel(date) }));
  });

  readonly filteredItems = computed(() => {
    const searchNeedle = this.querySearch().trim().toLowerCase();
    const selectedDay = this.selectedDay();

    return this.items().filter((item) => {
      if (selectedDay !== 'all' && item.dayKey !== selectedDay) return false;
      if (!searchNeedle) return true;
      return item.displayQuery.toLowerCase().includes(searchNeedle);
    });
  });

  readonly groupedItems = computed<HistoryDayGroup[]>(() => {
    const groups = new Map<string, HistoryViewItem[]>();

    for (const item of this.filteredItems()) {
      const list = groups.get(item.dayKey) || [];
      list.push(item);
      groups.set(item.dayKey, list);
    }

    return Array.from(groups.entries())
      .sort((a, b) => b[1][0].createdDate.getTime() - a[1][0].createdDate.getTime())
      .map(([dayKey, entries]) => ({
        dayKey,
        dayLabel: this.formatDayLabel(entries[0].createdDate),
        items: entries,
      }));
  });

  ngOnInit() {
    const rawReturnUrl = (this.route.snapshot.queryParamMap.get('returnUrl') || '').trim();
    this.returnUrl = rawReturnUrl.startsWith('/') ? rawReturnUrl : '/';
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.auth
      .fetchSearchHistory({ limit: 200 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.items.set(items.map((item) => this.toViewItem(item))),
        error: () => this.error.set(this.t('failedLoad')),
      });
  }

  open(item: HistoryViewItem) {
    const filters = this.buildFiltersFromHistory(item);
    if (!filters.query) return;

    this.searchService.search(filters);
    this.router.navigate(['/results'], { queryParams: { q: filters.query } });
  }

  deleteItem(item: HistoryViewItem, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.deletingIds().has(item.id)) return;

    const nextSet = new Set(this.deletingIds());
    nextSet.add(item.id);
    this.deletingIds.set(nextSet);

    this.auth.deleteSearchHistoryItem(item.id).subscribe({
      next: (res) => {
        if (res.deleted) {
          this.items.set(this.items().filter((candidate) => candidate.id !== item.id));
        }

        const resetSet = new Set(this.deletingIds());
        resetSet.delete(item.id);
        this.deletingIds.set(resetSet);
      },
      error: () => {
        const resetSet = new Set(this.deletingIds());
        resetSet.delete(item.id);
        this.deletingIds.set(resetSet);
        this.error.set(this.t('failedDelete'));
      },
    });
  }

  clearAll() {
    if (!this.items().length || this.deletingAll()) return;
    if (!window.confirm(this.t('confirmDeleteAll'))) return;

    this.deletingAll.set(true);
    this.error.set(null);
    this.auth
      .clearSearchHistory()
      .pipe(finalize(() => this.deletingAll.set(false)))
      .subscribe({
        next: () => this.items.set([]),
        error: () => this.error.set(this.t('failedClear')),
      });
  }

  onSearchInput(value: string) {
    this.querySearch.set(value);
  }

  onSelectDay(value: string) {
    this.selectedDay.set(value || 'all');
  }

  resetFilters() {
    this.querySearch.set('');
    this.selectedDay.set('all');
  }

  goBack() {
    this.router.navigateByUrl(this.returnUrl || '/');
  }

  isDeleting(id: number): boolean {
    return this.deletingIds().has(id);
  }

  private toViewItem(item: SearchHistoryItem): HistoryViewItem {
    const parsed = this.parseHistoryQuery(item.query || '');
    const createdDate = new Date(item.createdAt);
    const dayKey = this.toDayKey(createdDate);

    return {
      ...item,
      parsed,
      createdDate,
      dayKey,
      displayQuery: parsed.query || (item.query || '').trim(),
    };
  }

  private buildFiltersFromHistory(item: HistoryViewItem): SearchFilters {
    const country = (item.region || '').trim().toLowerCase();
    const parsed = item.parsed;

    return {
      query: parsed.query,
      country: country || undefined,
      site: parsed.site || undefined,
      similar: parsed.similar || undefined,
      exclude: parsed.exclude?.length ? parsed.exclude : undefined,
      exact: parsed.exact?.length ? parsed.exact : undefined,
      fileTypes: parsed.fileTypes?.length ? parsed.fileTypes : undefined,
      page: 1,
    };
  }

  private parseHistoryQuery(input: string): SearchFilters {
    const raw = (input || '').trim();
    if (!raw) return { query: '' };

    const baseWords: string[] = [];
    const exact: string[] = [];
    const exclude: string[] = [];
    const fileTypes: string[] = [];
    let site: string | undefined;
    let similar: string | undefined;

    const tokens = raw.match(/"[^"]+"|\S+/g) || [];

    for (const token of tokens) {
      const lower = token.toLowerCase();

      if (token.startsWith('"') && token.endsWith('"') && token.length > 1) {
        const phrase = token.slice(1, -1).trim();
        if (phrase) exact.push(phrase);
        continue;
      }

      if (lower.startsWith('site:')) {
        const value = token.slice(5).trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
        if (value) site = value.toLowerCase();
        continue;
      }

      if (lower.startsWith('related:')) {
        const value = token.slice(8).trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
        if (value) similar = value.toLowerCase();
        continue;
      }

      if (lower.startsWith('filetype:')) {
        const type = token.slice(9).trim().toLowerCase();
        if (type) fileTypes.push(type);
        continue;
      }

      if (token.startsWith('-') && token.length > 1) {
        const word = token.slice(1).trim();
        if (word) exclude.push(word);
        continue;
      }

      baseWords.push(token);
    }

    return {
      query: baseWords.join(' ').trim(),
      site,
      similar,
      exclude: Array.from(new Set(exclude)),
      exact: Array.from(new Set(exact)),
      fileTypes: Array.from(new Set(fileTypes)),
    };
  }

  private toDayKey(date: Date): string {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return 'invalid';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDayLabel(date: Date): string {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return this.t('unknownDay');
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfInput = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const diffDays = Math.round((startOfToday - startOfInput) / 86400000);

    if (diffDays === 0) return this.t('today');
    if (diffDays === 1) return this.t('yesterday');

    return date.toLocaleDateString(this.selectedLanguage === 'ru' ? 'ru-RU' : undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

interface HistoryViewItem extends SearchHistoryItem {
  parsed: SearchFilters;
  displayQuery: string;
  createdDate: Date;
  dayKey: string;
}

interface HistoryDayGroup {
  dayKey: string;
  dayLabel: string;
  items: HistoryViewItem[];
}
