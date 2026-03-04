import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import emojiFlags from 'emoji-flags';
import { SearchService } from '../../services/search.service';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Search,
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
} from 'lucide-angular';
import { trigger, transition, style, animate, query, stagger, group } from '@angular/animations';

interface Country {
  code: string;
  name: string;
  svg: string;
}

export interface SearchFilters {
  query: string;
  country?: string;
  region?: string;
  city?: string;
  site?: string;
  similar?: string;
  exclude?: string[];
  exact?: string[];
  fileTypes?: string[];
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
    // 1. Начальное состояние контейнера
    style({
      opacity: 0,
      transform: 'translateY(-20px) scale(0.98)',
      filter: 'blur(10px)',
    }),
    group([
      // 2. Плавное проявление самого контейнера
      animate(
        '400ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        style({
          opacity: 1,
          transform: 'translateY(0) scale(1)',
          filter: 'blur(0px)',
        }),
      ),
      // 3. Каскадное появление внутренних элементов (опционально)
      // Ищем элементы с классом .filter-item и заставляем их "всплывать"
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
      // Контейнер исчезает чуть быстрее
      animate(
        '250ms ease-in',
        style({
          opacity: 0,
          transform: 'translateY(-15px) scale(0.98)',
          filter: 'blur(5px)',
        }),
      ),
      // Элементы внутри слегка "тонут" при закрытии
      query(
        '.filter-item',
        [animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(5px)' }))],
        { optional: true },
      ),
    ]),
  ]),
]);

@Component({
  selector: 'app-main',
  standalone: true,
  templateUrl: './main.component.html',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  animations: [fadeIn, slideUp, cardAnim, filtersAnim], // 👈 добавили
})
export class MainComponent implements OnInit {
  readonly SearchIcon = Search;
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

  // ========================
  // CORE STATE
  // ========================

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
  activeFilter: string | null = null;

  isCountryManuallySelected = false;
  private countryAutoDetected = false;
  private autoDetectedCountryCode: string | null = null;

  readonly fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];

  constructor(
    private searchService: SearchService,
    private router: Router,
  ) {}

  // ========================
  // INIT
  // ========================

  ngOnInit() {
    this.loadCountries();
    this.detectCountry();
  }

  private loadCountries() {
    this.regions = emojiFlags.data.map((c) => ({
      code: c.code,
      name: c.name,
      svg: `3x2/${c.code}.svg`,
    }));
  }

  // ========================
  // COUNTRY AUTO-DETECT
  // ========================

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

  // ========================
  // WORD MANAGEMENT
  // ========================

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
    } else {
      this.excludeWords = this.excludeWords.filter((w) => w !== word);
    }
  }

  // ========================
  // DOMAIN LOGIC
  // ========================

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

  // ========================
  // FILE TYPES
  // ========================

  toggleFileType(type: string) {
    if (this.fileTypesSelected.includes(type)) {
      this.fileTypesSelected = this.fileTypesSelected.filter((t) => t !== type);
    } else {
      this.fileTypesSelected.push(type);
    }
  }

  removeFileType(type: string) {
    this.fileTypesSelected = this.fileTypesSelected.filter((t) => t !== type);
  }

  // ========================
  // SEARCH
  // ========================

  private cleanArray(arr: string[]): string[] | undefined {
    return arr.length ? arr : undefined;
  }

  private buildPayload(): SearchFilters | null {
    if (!this.query.trim()) return null;

    return {
      query: this.query.trim(),
      country: this.selectedCountry?.code?.toLowerCase(),
      city: this.regionQuery || undefined, // ✅ вернуть
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
    this.router.navigate(['/results']);
  }

  get hasFilters(): boolean {
    const selectedCountryCode = this.selectedCountry?.code.toLowerCase() ?? null;
    const hasCountryFilter = this.isCountryManuallySelected
      ? selectedCountryCode !== this.autoDetectedCountryCode
      : false;

    return !!(
      this.activeSite ||
      this.activeSimilar ||
      this.excludeWords.length ||
      this.exactWords.length ||
      this.fileTypesSelected.length ||
      hasCountryFilter
    );
  }
}
