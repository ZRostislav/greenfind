import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import emojiFlags from 'emoji-flags';
import {
  AiOverview,
  ImageResult,
  KnowledgeGraph,
  KnowledgeGraphFact,
  KnowledgeGraphRelation,
  SearchFilters,
  SearchService,
} from '../../services/search.service';
import {
  LucideAngularModule,
  Search,
  Mic,
  Sliders,
  Globe,
  Link,
  Star,
  Check,
  X,
  Plus,
  Minus,
  Type,
  FileText,
  Leaf,
  ArrowRight,
  LogOutIcon,
  HistoryIcon,
  UserIcon,
  Shield,
  ImageIcon,
} from 'lucide-angular';
import { SavedLink, SavedLinksService } from '../../services/saved-links.service';
import { AuthService } from '../../services/auth.service';
import { AuthStateService, User } from '../../services/auth-state.service';
import { environment } from '../../environments/environment';
import { AppLanguage, LanguageService } from '../../services/language.service';
import { LanguageSwitcherComponent } from '../shared/language-switcher/language-switcher.component';

interface CountryOption {
  code: string;
  name: string;
  flagSrc: string;
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, LanguageSwitcherComponent],
  templateUrl: './results.component.html',
})
export class ResultsComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly SearchIcon = Search;
  readonly MicIcon = Mic;
  readonly SlidersIcon = Sliders;
  readonly GlobeIcon = Globe;
  readonly LinkIcon = Link;
  readonly StarIcon = Star;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly PlusIcon = Plus;
  readonly MinusIcon = Minus;
  readonly TypeIcon = Type;
  readonly FileTextIcon = FileText;
  readonly LeafIcon = Leaf;
  readonly ArrowRightIcon = ArrowRight;
  readonly LogOutIcon = LogOutIcon;
  readonly HistoryIcon = HistoryIcon;
  readonly UserIcon = UserIcon;
  readonly ShieldIcon = Shield;
  readonly ImageIcon = ImageIcon;
  readonly filterInputClass =
    'w-full h-11 rounded-2xl border border-white/25 bg-transparent px-4 text-sm text-white placeholder:text-white/32 outline-none transition-all focus:border-ui-green-light/70 focus:shadow-[0_0_0_3px_rgba(87,200,77,0.16)]';
  readonly filterButtonClass =
    'h-11 rounded-2xl border border-white/30 bg-transparent px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80 transition-all hover:border-white/50 hover:text-white';
  readonly filterAccentButtonClass =
    'h-11 rounded-2xl border border-ui-green-light/70 bg-transparent px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ui-green-light transition-all hover:border-ui-green-light hover:text-white';
  readonly filterIconButtonClass =
    'h-11 w-11 shrink-0 rounded-2xl border border-white/30 bg-transparent text-white/80 transition-all hover:border-white/50 hover:text-white flex items-center justify-center';
  private readonly language = inject(LanguageService);
  readonly languageOptions = this.language.languageOptions;
  readonly languageLabels = this.language.languageLabels;
  private readonly translations: Record<AppLanguage, Record<string, string>> = {
    en: {
      searchPlaceholder: 'Search the web...',
      web: 'Web',
      images: 'Images',
      history: 'History',
      admin: 'Admin',
      logout: 'Logout',
      country: 'Country',
      searchCountryOrCode: 'Search country or code...',
      noCountriesFound: 'No countries found',
      siteFilter: 'Site Filter',
      similarSources: 'Similar Sources',
      apply: 'Apply',
      sitePrefix: 'site:',
      relatedPrefix: 'related:',
      include: 'Include',
      exclude: 'Exclude',
      exactPhrase: 'Exact phrase',
      wordToSkip: 'Word to skip',
      preferredFileTypes: 'Preferred File Types',
      applyFilters: 'Apply Filters',
      analyzingEcosystem: 'Analyzing Ecosystem',
      aiOverview: 'AI Overview',
      noImagesFound: 'No images found.',
      noTrailsFound: 'No trails found.',
      removeFromSaved: 'Remove from saved',
      saveLink: 'Save link',
      saved: 'Saved',
      save: 'Save',
      relatedSearches: 'Related Searches',
      back: 'back',
      next: 'next',
      overview: 'Overview',
      peopleAlsoSearchFor: 'People Also Search For',
      sources: 'Sources',
      liveInsights: 'Live Insights',
      hideDetails: 'Hide details',
      showDetails: 'Show details',
      showingLiveDataFor: 'Showing live data for:',
      defaultInsightsHint:
        'Start a search and this panel will show live metrics, quick actions, and context for your current query.',
      mode: 'Mode',
      results: 'Results',
      filters: 'Filters',
      status: 'Status',
      updating: 'Updating',
      synced: 'Synced',
      hideFilters: 'Hide filters',
      openFilters: 'Open filters',
      switchToImages: 'Switch to images',
      suggestedQueries: 'Suggested queries',
      page: 'Page',
      savedCount: 'Saved',
      imagePreview: 'Image preview',
      loadingSize: 'Loading size...',
      close: 'Close',
      openSource: 'Open source',
      download: 'Download',
      blockedBySafety: 'Blocked by 18+ safety mode.',
      enterValidDomain: 'Enter a valid domain',
    },
    ru: {
      searchPlaceholder: 'Поиск в интернете...',
      web: 'Веб',
      images: 'Картинки',
      history: 'История',
      admin: 'Админ',
      logout: 'Выйти',
      country: 'Страна',
      searchCountryOrCode: 'Поиск страны или кода...',
      noCountriesFound: 'Страны не найдены',
      siteFilter: 'Фильтр сайта',
      similarSources: 'Похожие источники',
      apply: 'Применить',
      sitePrefix: 'сайт:',
      relatedPrefix: 'похожее:',
      include: 'Включить',
      exclude: 'Исключить',
      exactPhrase: 'Точная фраза',
      wordToSkip: 'Слово для исключения',
      preferredFileTypes: 'Предпочтительные типы файлов',
      applyFilters: 'Применить фильтры',
      analyzingEcosystem: 'Анализ экосистемы',
      aiOverview: 'Сводка AI',
      noImagesFound: 'Изображения не найдены.',
      noTrailsFound: 'Результаты не найдены.',
      removeFromSaved: 'Убрать из сохраненного',
      saveLink: 'Сохранить ссылку',
      saved: 'Сохранено',
      save: 'Сохранить',
      relatedSearches: 'Похожие запросы',
      back: 'назад',
      next: 'дальше',
      overview: 'Обзор',
      peopleAlsoSearchFor: 'Люди также ищут',
      sources: 'Источники',
      liveInsights: 'Живые инсайты',
      hideDetails: 'Скрыть детали',
      showDetails: 'Показать детали',
      showingLiveDataFor: 'Показываем данные для:',
      defaultInsightsHint:
        'Начните поиск, и эта панель покажет метрики, быстрые действия и контекст по вашему запросу.',
      mode: 'Режим',
      results: 'Результаты',
      filters: 'Фильтры',
      status: 'Статус',
      updating: 'Обновление',
      synced: 'Синхронизировано',
      hideFilters: 'Скрыть фильтры',
      openFilters: 'Открыть фильтры',
      switchToImages: 'Переключить на картинки',
      suggestedQueries: 'Рекомендуемые запросы',
      page: 'Страница',
      savedCount: 'Сохранено',
      imagePreview: 'Предпросмотр изображения',
      loadingSize: 'Загрузка размера...',
      close: 'Закрыть',
      openSource: 'Открыть источник',
      download: 'Скачать',
      blockedBySafety: 'Заблокировано режимом безопасности 18+.',
      enterValidDomain: 'Введите корректный домен',
    },
  };

  results$: Observable<any[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  relatedSearches$: Observable<any[]>;
  pagination$: Observable<any>;
  knowledgeGraph$: Observable<KnowledgeGraph | null>;
  aiOverview$: Observable<AiOverview | null>;
  imageResults$: Observable<ImageResult[]>;
  savedLinks$: Observable<SavedLink[]>;
  user$: Observable<User | null>;
  activeImage: ImageResult | null = null;
  activeImageSize: { width: number; height: number } | null = null;
  @ViewChild('imageLoadSentinel') imageLoadSentinel?: ElementRef<HTMLElement>;
  private imageObserver: IntersectionObserver | null = null;
  private paginationSub?: Subscription;
  private imageResultsSub?: Subscription;
  private currentPagination: any = null;
  private imageResultCount = 0;
  private pendingAppendBaselineCount: number | null = null;
  private hasMoreImagePages = true;

  query = '';
  mode: 'web' | 'images' = 'web';
  country = '';
  countryQuery = '';
  showCountryPicker = false;
  countries: CountryOption[] = [];

  siteInput = '';
  similarInput = '';
  activeSite: string | null = null;
  activeSimilar: string | null = null;

  excludeInput = '';
  excludeWords: string[] = [];
  exactInput = '';
  exactWords: string[] = [];

  readonly fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
  fileTypesSelected: string[] = [];

  siteError: string | null = null;
  similarError: string | null = null;
  showFilters = false;
  showInsightsDetails = false;

  get selectedLanguage(): AppLanguage {
    return this.language.currentLanguage();
  }

  setLanguage(language: AppLanguage): void {
    this.language.setLanguage(language);
  }

  t(key: string): string {
    return this.translations[this.language.currentLanguage()][key] ?? this.translations.en[key] ?? key;
  }

  constructor(
    private searchService: SearchService,
    private route: ActivatedRoute,
    private router: Router,
    private savedLinks: SavedLinksService,
    private auth: AuthService,
    private authState: AuthStateService,
  ) {
    this.results$ = this.searchService.results$;
    this.loading$ = this.searchService.loading$;
    this.error$ = this.searchService.error$;
    this.relatedSearches$ = this.searchService.relatedSearches$;
    this.pagination$ = this.searchService.pagination$;
    this.knowledgeGraph$ = this.searchService.knowledgeGraph$;
    this.aiOverview$ = this.searchService.aiOverview$;
    this.imageResults$ = this.searchService.imageResults$;
    this.savedLinks$ = this.savedLinks.links$;
    this.user$ = this.authState.user$;
    this.paginationSub = this.pagination$.subscribe((value) => {
      this.currentPagination = value;
    });
    this.imageResultsSub = this.imageResults$.subscribe((items) => {
      const nextCount = items.length;

      if (this.pendingAppendBaselineCount !== null) {
        // If count did not grow after requesting a new page, we reached the end.
        this.hasMoreImagePages = nextCount > this.pendingAppendBaselineCount;
        this.pendingAppendBaselineCount = null;
      }

      this.imageResultCount = nextCount;

      // The sentinel is rendered under *ngIf, so it may appear after view init.
      // Re-bind observer when image results arrive in image mode.
      if (this.mode === 'images' && nextCount > 0) {
        setTimeout(() => this.setupImageInfiniteScroll(), 0);
      }
    });
  }

  ngOnInit() {
    this.loadCountries();
    const filtersFromRoute = this.parseFiltersFromRoute();
    const savedFilters = this.searchService.getCurrentFilters();
    const hasQueryInRoute = !!filtersFromRoute.query;

    this.patchFromFilters(hasQueryInRoute ? filtersFromRoute : savedFilters);

    const shouldRunInitialSearch =
      !!this.query &&
      !this.searchService.isLoading() &&
      (!this.searchService.hasResults() ||
        this.query !== savedFilters.query ||
        JSON.stringify(filtersFromRoute) !== JSON.stringify(savedFilters));

    if (shouldRunInitialSearch) {
      this.doSearch();
    }
  }

  ngAfterViewInit() {
    this.setupImageInfiniteScroll();
  }

  ngOnDestroy() {
    this.imageObserver?.disconnect();
    this.paginationSub?.unsubscribe();
    this.imageResultsSub?.unsubscribe();
  }

  doSearch() {
    const payload = this.buildPayload();
    if (!payload) return;

    this.hasMoreImagePages = true;
    this.pendingAppendBaselineCount = null;
    this.searchService.search(payload);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.buildQueryParams(payload),
      replaceUrl: true,
    });
  }

  addWord(type: 'exact' | 'exclude') {
    const input = type === 'exact' ? this.exactInput : this.excludeInput;
    const word = input.trim();
    if (!word) return;

    const target = type === 'exact' ? this.exactWords : this.excludeWords;
    if (!target.includes(word)) {
      target.push(word);
    }

    if (type === 'exact') {
      this.exactInput = '';
    } else {
      this.excludeInput = '';
    }
  }

  removeWord(type: 'exact' | 'exclude', word: string) {
    if (type === 'exact') {
      this.exactWords = this.exactWords.filter((item) => item !== word);
      return;
    }

    this.excludeWords = this.excludeWords.filter((item) => item !== word);
  }

  applySiteFilter() {
    if (!this.siteInput.trim()) {
      this.removeSiteFilter();
      return;
    }

    if (!this.isValidDomain(this.siteInput)) {
      this.siteError = this.t('enterValidDomain');
      return;
    }

    this.siteError = null;
    this.activeSite = this.normalizeDomain(this.siteInput);
    this.siteInput = this.activeSite;
  }

  applySimilarFilter() {
    if (!this.similarInput.trim()) {
      this.removeSimilarFilter();
      return;
    }

    if (!this.isValidDomain(this.similarInput)) {
      this.similarError = this.t('enterValidDomain');
      return;
    }

    this.similarError = null;
    this.activeSimilar = this.normalizeDomain(this.similarInput);
    this.similarInput = this.activeSimilar;
  }

  removeSiteFilter() {
    this.activeSite = null;
    this.siteInput = '';
    this.siteError = null;
  }

  removeSimilarFilter() {
    this.activeSimilar = null;
    this.similarInput = '';
    this.similarError = null;
  }

  toggleFileType(type: string) {
    if (this.fileTypesSelected.includes(type)) {
      this.fileTypesSelected = this.fileTypesSelected.filter((item) => item !== type);
      return;
    }

    this.fileTypesSelected.push(type);
  }

  filteredCountries(): CountryOption[] {
    const q = this.countryQuery.trim().toLowerCase();
    const list = !q
      ? this.countries
      : this.countries.filter(
          (country) =>
            country.name.toLowerCase().includes(q) || country.code.toLowerCase().includes(q),
        );

    return list.slice(0, 18);
  }

  openCountryPicker() {
    this.showCountryPicker = true;
  }

  closeCountryPicker() {
    setTimeout(() => {
      this.showCountryPicker = false;
      this.syncCountryQueryFromCode();
    }, 120);
  }

  selectCountry(country: CountryOption) {
    this.country = country.code.toLowerCase();
    this.countryQuery = country.name;
    this.showCountryPicker = false;
  }

  clearCountry() {
    this.country = '';
    this.countryQuery = '';
    this.showCountryPicker = false;
  }

  getSelectedCountry(): CountryOption | null {
    const code = this.country.trim().toUpperCase();
    if (!code) return null;
    return this.countries.find((item) => item.code === code) ?? null;
  }

  applyCountryInput() {
    const query = this.countryQuery.trim().toLowerCase();
    if (!query) {
      this.clearCountry();
      return;
    }

    const exactMatch = this.countries.find(
      (country) =>
        country.code.toLowerCase() === query || country.name.toLowerCase() === query,
    );

    if (exactMatch) {
      this.selectCountry(exactMatch);
      return;
    }

    const firstMatch = this.filteredCountries()[0];
    if (firstMatch) {
      this.selectCountry(firstMatch);
      return;
    }

    this.syncCountryQueryFromCode();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.country.trim() ||
      this.activeSite ||
      this.activeSimilar ||
      this.excludeWords.length ||
      this.exactWords.length ||
      this.fileTypesSelected.length
    );
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.country.trim()) count += 1;
    if (this.activeSite) count += 1;
    if (this.activeSimilar) count += 1;
    count += this.excludeWords.length;
    count += this.exactWords.length;
    count += this.fileTypesSelected.length;
    return count;
  }

  trackByLink(index: number, item: any): string {
    return item.link ?? `${index}`;
  }

  trackByValue(index: number, value: string): string {
    return value || `${index}`;
  }

  trackByCountry(index: number, country: CountryOption): string {
    return country.code || `${index}`;
  }

  trackByFact(index: number, fact: KnowledgeGraphFact): string {
    return `${fact.label}-${fact.value}-${index}`;
  }

  trackByRelation(index: number, relation: KnowledgeGraphRelation): string {
    return relation.link ?? `${relation.name}-${index}`;
  }

  trackBySource(index: number, source: string): string {
    return source || `${index}`;
  }

  trackByAiSource(index: number, source: { title: string; link: string }): string {
    return source?.link || `${index}`;
  }

  trackByImageResult(index: number, item: ImageResult): string {
    return item?.link || `${index}`;
  }

  openImagePreview(image: ImageResult, event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    this.activeImage = image;
    this.activeImageSize = null;
  }

  closeImagePreview() {
    this.activeImage = null;
    this.activeImageSize = null;
  }

  onPreviewImageLoad(event: Event) {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;

    this.activeImageSize = {
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  }

  downloadActiveImage() {
    if (!this.activeImage?.original) return;
    const a = document.createElement('a');
    const apiBase = `${environment.apiUrl}`.replace(/\/$/, '');
    a.href = `${apiBase}/search/download-image?url=${encodeURIComponent(this.activeImage.original)}`;
    a.download = 'image';
    a.click();
  }

  private patchFromFilters(filters: SearchFilters) {
    this.query = filters.query ?? '';
    this.mode = filters.mode === 'images' ? 'images' : 'web';
    this.country = filters.country ?? '';

    this.activeSite = filters.site ?? null;
    this.activeSimilar = filters.similar ?? null;
    this.siteInput = this.activeSite ?? '';
    this.similarInput = this.activeSimilar ?? '';

    this.excludeWords = [...(filters.exclude ?? [])];
    this.exactWords = [...(filters.exact ?? [])];
    this.fileTypesSelected = [...(filters.fileTypes ?? [])];
    this.syncCountryQueryFromCode();
  }

  private loadCountries() {
    this.countries = emojiFlags.data
      .map((entry) => ({
        code: entry.code,
        name: entry.name,
        flagSrc: `/3x2/${entry.code}.svg`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private syncCountryQueryFromCode() {
    const normalizedCode = this.country.trim().toUpperCase();
    if (!normalizedCode) {
      this.countryQuery = '';
      return;
    }

    const match = this.countries.find((item) => item.code === normalizedCode);
    this.countryQuery = match ? match.name : normalizedCode;
  }

  private buildPayload(): SearchFilters | null {
    const query = this.query.trim();
    if (!query) return null;

    return {
      query,
      mode: this.mode,
      country: this.country.trim().toLowerCase() || undefined,
      site: this.activeSite || undefined,
      similar: this.activeSimilar || undefined,
      exclude: this.excludeWords,
      exact: this.exactWords,
      fileTypes: this.fileTypesSelected,
    };
  }

  private normalizeDomain(domain: string): string {
    return domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .trim()
      .toLowerCase();
  }

  private isValidDomain(domain: string): boolean {
    const regex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return regex.test(domain.trim());
  }

  goToPage(page: number) {
    const currentFilters = this.searchService.getCurrentFilters();
    const newFilters = { ...currentFilters, page };
    this.searchService.search(newFilters);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.buildQueryParams(newFilters),
      replaceUrl: true,
    });
  }

  searchRelated(query: string) {
    this.query = query;
    this.doSearch();
  }

  setMode(mode: 'web' | 'images') {
    if (this.mode === mode) return;
    this.mode = mode;
    this.doSearch();
    setTimeout(() => this.setupImageInfiniteScroll(), 0);
  }

  isSaved(url: string): boolean {
    return this.savedLinks.isSaved(url);
  }

  toggleSaved(item: any, event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();

    const res = this.savedLinks.toggle(item?.link, item?.title);
    if (!res.ok && res.reason === 'AUTH_REQUIRED') {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    }
  }

  guardExternalNavigation(
    payload: {
      url?: string | null;
      title?: string | null;
      snippet?: string | null;
      source?: string | null;
    },
    event?: MouseEvent,
  ): boolean {
    if (!this.searchService.shouldBlockNavigation(payload)) return true;

    event?.preventDefault();
    event?.stopPropagation();
    window.alert(this.t('blockedBySafety'));
    return false;
  }

  handleExternalClick(
    payload: {
      url?: string | null;
      title?: string | null;
      snippet?: string | null;
      source?: string | null;
      position?: number | null;
    },
    event?: MouseEvent,
  ) {
    if (!this.guardExternalNavigation(payload, event)) return;

    if (payload.url) {
      this.searchService.trackResultClick({
        url: payload.url,
        title: payload.title ?? null,
        position: payload.position ?? null,
      });
    }
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/'));
  }

  getReturnUrl(): string {
    return this.router.url || '/';
  }

  private parseFiltersFromRoute(): SearchFilters {
    const qp = this.route.snapshot.queryParamMap;
    const split = (key: string): string[] | undefined => {
      const value = qp.get(key)?.trim();
      if (!value) return undefined;
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    };

    const pageRaw = Number(qp.get('page'));
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

    return {
      query: qp.get('q')?.trim() || '',
      mode: qp.get('mode') === 'images' ? 'images' : 'web',
      country: qp.get('country')?.trim().toLowerCase() || undefined,
      site: qp.get('site')?.trim() || undefined,
      similar: qp.get('similar')?.trim() || undefined,
      exclude: split('exclude'),
      exact: split('exact'),
      fileTypes: split('fileTypes'),
      page,
    };
  }

  private buildQueryParams(filters: SearchFilters): Params {
    const clean = (value?: string | null): string | undefined => {
      const normalized = (value || '').trim();
      return normalized || undefined;
    };

    const join = (values?: string[]): string | undefined => {
      if (!values?.length) return undefined;
      const normalized = values.map((item) => item.trim()).filter((item) => item.length > 0);
      if (!normalized.length) return undefined;
      return Array.from(new Set(normalized)).join(',');
    };

    return {
      q: clean(filters.query),
      mode: filters.mode === 'images' ? 'images' : undefined,
      country: clean(filters.country),
      site: clean(filters.site),
      similar: clean(filters.similar),
      exclude: join(filters.exclude),
      exact: join(filters.exact),
      fileTypes: join(filters.fileTypes),
      page: (filters.page || 1) > 1 ? String(filters.page) : undefined,
    };
  }

  private setupImageInfiniteScroll() {
    if (!this.imageLoadSentinel?.nativeElement) return;

    this.imageObserver?.disconnect();
    this.imageObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        if (this.mode !== 'images') return;
        if (this.searchService.isLoading()) return;
        if (!this.currentPagination?.next && !this.hasMoreImagePages) return;

        const currentFilters = this.searchService.getCurrentFilters();
        const nextFilters: SearchFilters = {
          ...currentFilters,
          mode: 'images',
          page: (currentFilters.page || 1) + 1,
        };

        this.pendingAppendBaselineCount = this.imageResultCount;
        this.searchService.search(nextFilters, { appendImages: true });
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: this.buildQueryParams(nextFilters),
          replaceUrl: true,
        });
      },
      { rootMargin: '350px 0px' },
    );

    this.imageObserver.observe(this.imageLoadSentinel.nativeElement);
  }
}
