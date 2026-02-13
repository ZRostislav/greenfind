import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import emojiFlags from 'emoji-flags';
import { SearchService } from '../../services/search.service';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

interface Country {
  code: string;
  name: string;
  svg: string;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
})
export class MainComponent implements OnInit {
  query = '';
  filters = {
    site: '',
    region: '',
    exclude: '',
    exact: '',
    similar: '',
  };
  selectedCountry: Country | null = null;
  showFilters = false;
  activeFilter: string | null = null;
  siteError = false;
  siteErrorText = '';
  similarError = false;
  similarErrorText = '';
  activeSite: {
    domain: string;
    favicon: string;
  } | null = null;
  activeSimilar: {
    domain: string;
    favicon: string;
  } | null = null;
  excludeInput = '';
  excludeWords: string[] = [];
  exactInput = '';
  exactWords: string[] = [];
  results: any = null;
  loading = false;
  error: string | null = null;

  constructor(
    private searchService: SearchService,
    private router: Router,
  ) {}

  addExactWord() {
    const word = this.exactInput.trim();

    if (!word) return;
    if (this.exactWords.includes(word)) return;

    this.exactWords.push(word);
    this.exactInput = '';
  }

  removeExactWord(word: string) {
    this.exactWords = this.exactWords.filter((w) => w !== word);
  }

  addExcludeWord() {
    const word = this.excludeInput.trim();

    if (!word) return;
    if (this.excludeWords.includes(word)) return;

    this.excludeWords.push(word);
    this.excludeInput = '';
  }

  removeExcludeWord(word: string) {
    this.excludeWords = this.excludeWords.filter((w) => w !== word);
  }

  toggleFilter(name: string) {
    // если уже открыт — закрываем
    if (this.activeFilter === name) {
      this.activeFilter = null;
      return;
    }

    // включаем новый фильтр
    this.activeFilter = name;

    // region → фокус на input
    if (name === 'region') {
      setTimeout(() => {
        const input = document.querySelector('.region-search') as HTMLInputElement;
        if (input) input.focus();
      });
    }

    // site → фокус на сайт input
    if (name === 'site') {
      setTimeout(() => {
        const input = document.querySelector('.site-input') as HTMLInputElement;
        if (input) input.focus();
      });
    }

    if (name === 'similar') {
      setTimeout(() => {
        const input = document.querySelector('.similar-input') as HTMLInputElement;
        if (input) input.focus();
      });
    }
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
    this.activeFilter = null;
  }

  regionQuery = '';
  showRegionList = false;
  regions: Country[] = []; // страны с SVG

  ngOnInit() {
    this.loadCountriesWithSVG();
    this.detectCountry();
  }

  loadCountriesWithSVG() {
    // emojiFlags.data содержит все страны, берем код ISO и название
    this.regions = emojiFlags.data.map((c) => ({
      code: c.code, // US, RU, FR...
      name: c.name, // United States, Russia...
      svg: `3x2/${c.code}.svg`, // путь к SVG флагу в assets
    }));
  }

  async detectCountry() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      const code = data.country_code;

      const country = this.regions.find((r) => r.code === code);
      if (country) {
        this.filters.region = country.name;

        this.regionQuery = ''; // input остается пустым
        this.selectedCountry = country; // показываем SVG вместо input
      }
    } catch (e) {
      console.warn('Не удалось определить страну');
    }
  }

  filteredRegions() {
    const q = this.regionQuery.toLowerCase();
    return this.regions.filter((r) => r.name.toLowerCase().includes(q));
  }

  selectRegion(country: Country) {
    this.selectedCountry = country;
    this.showRegionList = false;
    this.activeFilter = '';
  }

  editRegion() {
    this.selectedCountry = null;
    this.regionQuery = '';
    this.showRegionList = true;
  }

  validateSite() {
    if (!this.filters.site) {
      this.siteError = false;
      this.siteErrorText = '';
      return true;
    }

    const siteRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

    const isValid = siteRegex.test(this.filters.site.trim());

    this.siteError = !isValid;
    this.siteErrorText = isValid ? '' : 'Enter a valid domain (example.com)';

    return isValid;
  }

  validateSimilar() {
    if (!this.filters.similar) {
      this.similarError = false;
      this.similarErrorText = '';
      return true;
    }

    const similarRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

    const isValid = similarRegex.test(this.filters.similar.trim());

    this.similarError = !isValid;
    this.similarErrorText = isValid ? '' : 'Enter a valid domain (example.com)';

    return isValid;
  }

  applySiteFilter() {
    if (!this.validateSite()) {
      return;
    }

    // нормализация домена
    const domain = this.filters.site
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .trim();

    this.filters.site = domain;

    this.activeSite = {
      domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    };

    this.activeFilter = null;
  }

  applySimilarFilter() {
    if (!this.validateSimilar()) {
      return;
    }

    // нормализация домена
    const domain = this.filters.similar
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .trim();

    this.filters.similar = domain;

    this.activeSimilar = {
      domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    };

    this.activeFilter = null;
  }

  search() {
    if (!this.query.trim()) return;

    this.searchService.search({
      query: this.query.trim(),
      country: this.selectedCountry?.code?.toLowerCase(),
      city: this.filters.region || undefined,
      site: this.activeSite?.domain,
      similar: this.activeSimilar?.domain,
      exclude: this.excludeWords,
      exact: this.exactWords,
      fileTypes: this.fileTypesSelected,
    });

    this.router.navigate(['/results']);
  }

  removeSiteFilter() {
    this.activeSite = null;
    this.filters.site = '';
  }
  removeSimilarFilter() {
    this.activeSimilar = null;
    this.filters.similar = '';
  }

  ///

  fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];

  fileTypesSelected: string[] = [];

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

  private hasActiveFilters(): boolean {
    return !!(
      this.activeSite ||
      this.activeSimilar ||
      this.excludeWords.length ||
      this.exactWords.length ||
      this.fileTypesSelected.length ||
      this.selectedCountry ||
      this.filters.region
    );
  }
}
