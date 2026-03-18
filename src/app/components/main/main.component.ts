import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger, group } from '@angular/animations';
import emojiFlags from 'emoji-flags';
import {
  LucideAngularModule,
  Search,
  Mic,
  Sliders,
  Globe,
  Link,
  Check,
  X,
  Plus,
  Minus,
  Type,
  FileText,
  Leaf,
  ArrowRight,
  LogOutIcon,
} from 'lucide-angular';
import { SearchFilters, SearchService } from '../../services/search.service';
import { VoiceService } from '../../services/voice.service';
import { LoaderService } from '../../services/loader.service';
import { AuthService } from '../../services/auth.service';
import { AuthStateService } from '../../services/auth-state.service';
import { SavedLink, SavedLinksService } from '../../services/saved-links.service';

interface Country {
  code: string;
  name: string;
  svg: string;
}

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [style({ opacity: 0 }), animate('600ms ease-out', style({ opacity: 1 }))]),
]);

export const slideUp = trigger('slideUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(40px)' }),
    animate('700ms cubic-bezier(.22,1,.36,1)', style({ opacity: 1, transform: 'none' })),
  ]),
]);

export const cardAnim = trigger('cardAnim', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(30px)' }),
    animate('500ms ease-out', style({ opacity: 1, transform: 'none' })),
  ]),
]);

export const filtersAnim = trigger('filtersAnim', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateY(-20px) scale(0.98)',
    }),
    group([
      animate(
        '400ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        style({
          opacity: 1,
          transform: 'translateY(0) scale(1)',
        }),
      ),
      query(
        '.filter-item',
        [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(40, [
            animate('300ms 100ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ],
        { optional: true },
      ),
    ]),
  ]),
  transition(':leave', [
    group([
      animate(
        '250ms ease-in',
        style({
          opacity: 0,
          transform: 'translateY(-20px) scale(0.98)',
        }),
      ),
      query(
        '.filter-item',
        [animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(5px)' }))],
        { optional: true },
      ),
    ]),
  ]),
]);

export const favoritesPanelAnim = trigger('favoritesPanelAnim', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateY(-10px) scale(0.98)',
    }),
    animate(
      '240ms cubic-bezier(0.22, 1, 0.36, 1)',
      style({
        opacity: 1,
        transform: 'translateY(0) scale(1)',
      }),
    ),
  ]),
  transition(':leave', [
    animate(
      '180ms ease-in',
      style({
        opacity: 0,
        transform: 'translateY(-8px) scale(0.985)',
      }),
    ),
  ]),
]);

@Component({
  selector: 'app-main',
  standalone: true,
  templateUrl: './main.component.html',
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  animations: [fadeIn, slideUp, cardAnim, filtersAnim, favoritesPanelAnim],
})
export class MainComponent implements OnInit, OnDestroy {
  readonly SearchIcon = Search;
  readonly MicIcon = Mic;
  readonly SlidersIcon = Sliders;
  readonly GlobeIcon = Globe;
  readonly LinkIcon = Link;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly PlusIcon = Plus;
  readonly MinusIcon = Minus;
  readonly TypeIcon = Type;
  readonly FileTextIcon = FileText;
  readonly LeafIcon = Leaf;
  readonly ArrowRightIcon = ArrowRight;
  readonly LogOutIcon = LogOutIcon;

  query = '';

  siteInput = '';
  similarInput = '';

  excludeInput = '';
  exactInput = '';

  excludeWords: string[] = [];
  exactWords: string[] = [];
  fileTypesSelected: string[] = [];

  activeSite: string | null = null;
  activeSimilar: string | null = null;

  siteError: string | null = null;
  similarError: string | null = null;

  selectedCountry: Country | null = null;
  regionQuery = '';
  regions: Country[] = [];
  selectedCity: string | null = null;

  showFilters = false;
  showAddSavedPanel = false;
  activeFilter: string | null = null;

  isCountryManuallySelected = false;
  private countryAutoDetected = false;
  private autoDetectedCountryCode: string | null = null;

  private auth = inject(AuthService);
  private authState = inject(AuthStateService);
  private savedLinks = inject(SavedLinksService);

  user$ = this.authState.user$;
  savedLinks$ = this.savedLinks.links$;

  newSavedUrl = '';
  newSavedTitle = '';
  savedLinksError: string | null = null;

  editingUrl: string | null = null;
  editingTitle = '';

  logout() {
    this.auth.logout().subscribe();
  }

  readonly fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
  private readonly speechLanguage = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly voiceService = inject(VoiceService);

  readonly speechSupported = this.voiceService.supported;
  readonly isListening = this.voiceService.listening;
  readonly finalTranscript = this.voiceService.finalTranscript;
  readonly liveTranscript = this.voiceService.interimTranscript;
  readonly voiceError = this.voiceService.error;

  private readonly syncVoiceTranscript = effect(() => {
    const transcript = this.voiceService.transcript();
    if (transcript) {
      this.query = transcript;
    }
  });

  ngOnInit() {
    this.loadCountries();
    this.resetState();
    this.detectCountry();
    this.searchService.setFilters({ query: '' });
    this.searchService.clear();
    this.voiceService.resetTranscript();
    this.voiceService.initialize({
      lang: this.speechLanguage,
      continuous: true,
      interimResults: true,
      autoStopOnSilence: true,
      silenceTimeoutMs: 3500,
      restartOnEnd: true,
    });
  }

  ngOnDestroy(): void {
    this.voiceService.stop();
    this.voiceService.resetTranscript();
  }

  private loadCountries() {
    this.regions = emojiFlags.data.map((c) => ({
      code: c.code,
      name: c.name,
      svg: `3x2/${c.code}.svg`,
    }));
  }

  private resetState(): void {
    this.query = '';
    this.siteInput = '';
    this.similarInput = '';
    this.excludeInput = '';
    this.exactInput = '';

    this.excludeWords = [];
    this.exactWords = [];
    this.fileTypesSelected = [];

    this.activeSite = null;
    this.activeSimilar = null;

    this.siteError = null;
    this.similarError = null;

    this.selectedCountry = null;
    this.regionQuery = '';
    this.selectedCity = null;

    this.showFilters = false;
    this.activeFilter = null;

    this.isCountryManuallySelected = false;
    this.countryAutoDetected = false;
    this.autoDetectedCountryCode = null;
  }

  async detectCountry() {
    if (this.isCountryManuallySelected || this.countryAutoDetected) return;

    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();

      const country = this.regions.find(
        (r) => r.code.toLowerCase() === data.country_code.toLowerCase(),
      );

      if (country) {
        this.selectedCountry = country;
        this.countryAutoDetected = true;
        this.autoDetectedCountryCode = country.code.toLowerCase();
      }
    } catch {
      console.warn('Country detection failed');
    }
  }

  filteredRegions() {
    const q = this.regionQuery.trim().toLowerCase();

    if (!q) return this.regions;

    return this.regions
      .filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return a.name.localeCompare(b.name);
      });
  }

  selectRegion(country: Country) {
    this.selectedCountry = country;
    this.regionQuery = country.name;
    this.isCountryManuallySelected = true;
  }

  clearRegion() {
    this.selectedCountry = null;
    this.regionQuery = '';
    this.isCountryManuallySelected = true;
  }

  addWord(type: 'exact' | 'exclude') {
    const input = type === 'exact' ? this.exactInput : this.excludeInput;
    const word = input.trim();

    if (!word) return;

    const target = type === 'exact' ? this.exactWords : this.excludeWords;
    if (!target.includes(word)) {
      target.push(word);
    }

    if (type === 'exact') this.exactInput = '';
    else this.excludeInput = '';
  }

  removeWord(type: 'exact' | 'exclude', word: string) {
    if (type === 'exact') {
      this.exactWords = this.exactWords.filter((w) => w !== word);
      return;
    }

    this.excludeWords = this.excludeWords.filter((w) => w !== word);
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

  applySite() {
    if (!this.siteInput) {
      this.activeSite = null;
      return;
    }

    if (!this.isValidDomain(this.siteInput)) {
      this.siteError = 'Enter a valid domain';
      return;
    }

    this.siteError = null;
    this.activeSite = this.normalizeDomain(this.siteInput);
  }

  removeSite() {
    this.activeSite = null;
    this.siteInput = '';
  }

  applySimilar() {
    if (!this.similarInput) {
      this.activeSimilar = null;
      return;
    }

    if (!this.isValidDomain(this.similarInput)) {
      this.similarError = 'Enter a valid domain';
      return;
    }

    this.similarError = null;
    this.activeSimilar = this.normalizeDomain(this.similarInput);
  }

  removeSimilar() {
    this.activeSimilar = null;
    this.similarInput = '';
  }

  toggleFileType(type: string) {
    if (this.fileTypesSelected.includes(type)) {
      this.fileTypesSelected = this.fileTypesSelected.filter((t) => t !== type);
      return;
    }

    this.fileTypesSelected.push(type);
  }

  removeFileType(type: string) {
    this.fileTypesSelected = this.fileTypesSelected.filter((t) => t !== type);
  }

  toggleVoiceInput() {
    this.voiceService.toggle();
  }

  private getCityFilter(): string | undefined {
    const city = this.regionQuery.trim();
    if (!city) return undefined;

    if (this.selectedCountry && city.toLowerCase() === this.selectedCountry.name.toLowerCase()) {
      return undefined;
    }

    return city;
  }

  private buildPayload(): SearchFilters | null {
    const query = this.query.trim();
    if (!query) return null;

    return {
      query,
      country: this.selectedCountry?.code?.toLowerCase(),
      city: this.getCityFilter(),
      site: this.activeSite || undefined,
      similar: this.activeSimilar || undefined,
      exclude: this.excludeWords,
      exact: this.exactWords,
      fileTypes: this.fileTypesSelected,
    };
  }

  search() {
    const payload = this.buildPayload();
    if (!payload) return;

    this.searchService.search(payload);
    this.router.navigate(['/results'], {
      queryParams: { q: payload.query },
    });
  }

  get hasFilters(): boolean {
    const selectedCountryCode = this.selectedCountry?.code.toLowerCase() ?? null;
    const hasCountryFilter = this.isCountryManuallySelected
      ? selectedCountryCode !== this.autoDetectedCountryCode
      : false;
    const hasCityFilter = !!this.getCityFilter();

    return !!(
      this.activeSite ||
      this.activeSimilar ||
      this.excludeWords.length ||
      this.exactWords.length ||
      this.fileTypesSelected.length ||
      hasCountryFilter ||
      hasCityFilter
    );
  }

  trackBySavedLink(_index: number, item: SavedLink): string {
    return item.url;
  }

  addSavedLink() {
    this.savedLinksError = null;

    const res = this.savedLinks.add(this.newSavedUrl, this.newSavedTitle);
    if (!res.ok) {
      this.savedLinksError =
        res.reason === 'INVALID_URL'
          ? 'Enter a valid URL.'
          : res.reason === 'AUTH_REQUIRED'
            ? 'Please log in to save links.'
            : 'Unable to save link.';
      return;
    }

    this.newSavedUrl = '';
    this.newSavedTitle = '';
  }

  startEditSavedLink(link: SavedLink) {
    this.savedLinksError = null;
    this.editingUrl = link.url;
    this.editingTitle = link.title;
  }

  cancelEditSavedLink() {
    this.editingUrl = null;
    this.editingTitle = '';
  }

  saveSavedLinkTitle(url: string) {
    this.savedLinksError = null;
    const res = this.savedLinks.updateTitle(url, this.editingTitle);
    if (!res.ok) {
      this.savedLinksError =
        res.reason === 'EMPTY_TITLE'
          ? 'Title cannot be empty.'
          : res.reason === 'AUTH_REQUIRED'
            ? 'Please log in to edit saved links.'
            : 'Unable to update title.';
      return;
    }

    this.cancelEditSavedLink();
  }

  removeSavedLink(url: string) {
    this.savedLinksError = null;
    const res = this.savedLinks.remove(url);
    if (!res.ok) {
      this.savedLinksError =
        res.reason === 'AUTH_REQUIRED' ? 'Please log in to remove saved links.' : 'Unable to remove link.';
    }
  }

  getPrimaryFaviconUrl(url: string): string {
    try {
      return `${new URL(url).origin}/favicon.ico`;
    } catch {
      return this.getFallbackFaviconUrl(url);
    }
  }

  private getFallbackFaviconUrl(url: string): string {
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=64`;
  }

  onFaviconError(event: Event, url: string): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;

    const fallback = this.getFallbackFaviconUrl(url);
    if (img.dataset['fallbackApplied'] !== 'true') {
      img.dataset['fallbackApplied'] = 'true';
      img.src = fallback;
      return;
    }

    img.style.display = 'none';
  }

  getHostname(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }
}
