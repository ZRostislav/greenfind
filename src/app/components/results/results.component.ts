// components/results/results.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Search Results</h2>

    <!-- Search + Filters -->
    <div class="search-panel">
      <div class="search-row">
        <input type="text" placeholder="Search..." [(ngModel)]="query" />
        <button (click)="doSearch()">Search</button>
      </div>

      <div class="filters-row">
        <input type="text" placeholder="site (example.com)" [(ngModel)]="filters.site" />
        <input type="text" placeholder="similar (example.com)" [(ngModel)]="filters.similar" />
        <input
          type="text"
          placeholder="Exclude word"
          [(ngModel)]="excludeInput"
          (keydown.enter)="addExcludeWord()"
        />
        <button (click)="addExcludeWord()">Add Exclude</button>
        <input
          type="text"
          placeholder="Exact phrase"
          [(ngModel)]="exactInput"
          (keydown.enter)="addExactWord()"
        />
        <button (click)="addExactWord()">Add Exact</button>
      </div>

      <div class="active-filters" *ngIf="hasActiveFilters()">
        <span *ngIf="activeSite"
          >site:{{ activeSite.domain }} <button (click)="removeSiteFilter()">✕</button></span
        >
        <span *ngFor="let w of excludeWords"
          >-{{ w }} <button (click)="removeExcludeWord(w)">✕</button></span
        >
        <span *ngFor="let w of exactWords"
          >"{{ w }}" <button (click)="removeExactWord(w)">✕</button></span
        >
        <span *ngIf="activeSimilar"
          >related:{{ activeSimilar.domain }}
          <button (click)="removeSimilarFilter()">✕</button></span
        >
        <span *ngFor="let t of fileTypesSelected"
          >filetype:{{ t }} <button (click)="removeFileType(t)">✕</button></span
        >
      </div>

      <div class="filetypes">
        <button
          *ngFor="let t of fileTypes"
          [class.selected]="fileTypesSelected.includes(t)"
          (click)="toggleFileType(t)"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading$ | async">
      <p>Loading...</p>
    </div>

    <!-- Error -->
    <div *ngIf="error$ | async as error">
      <p>{{ error }}</p>
    </div>

    <!-- Results -->
    <ng-container *ngIf="results$ | async as results">
      <div *ngIf="!results?.length && !(loading$ | async)">
        <p>No results found</p>
      </div>

      <div *ngFor="let item of results; trackBy: trackByLink">
        <img *ngIf="item.favicon" [src]="item.favicon" alt="Favicon" />
        <h3>
          <a [href]="item.link" target="_blank" rel="noopener noreferrer">
            {{ item.title }}
          </a>
        </h3>

        <p>{{ item.snippet }}</p>
        <small>{{ item.link }}</small>
      </div>
    </ng-container>
  `,
})
export class ResultsComponent {
  results$: Observable<any[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  // Search / filters state (simplified copy from Main)
  query = '';
  filters: any = { site: '', similar: '' };
  excludeInput = '';
  excludeWords: string[] = [];
  exactInput = '';
  exactWords: string[] = [];
  activeSite: { domain: string; favicon: string } | null = null;
  activeSimilar: { domain: string; favicon: string } | null = null;
  fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
  fileTypesSelected: string[] = [];

  constructor(private searchService: SearchService) {
    this.results$ = this.searchService.results$;
    this.loading$ = this.searchService.loading$;
    this.error$ = this.searchService.error$;
  }

  doSearch() {
    if (!this.query?.trim()) return;

    // normalize site/similar
    if (this.filters.site) {
      const domain = this.filters.site
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .trim();
      this.filters.site = domain;
      this.activeSite = {
        domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      };
    }

    if (this.filters.similar) {
      const domain = this.filters.similar
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .trim();
      this.filters.similar = domain;
      this.activeSimilar = {
        domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      };
    }

    this.searchService.search({
      query: this.query.trim(),
      site: this.activeSite?.domain,
      similar: this.activeSimilar?.domain,
      exclude: this.excludeWords,
      exact: this.exactWords,
      fileTypes: this.fileTypesSelected,
    });
  }

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

  validateSite() {
    return true;
  }

  validateSimilar() {
    return true;
  }

  applySiteFilter() {
    // not used in simplified UI
  }

  applySimilarFilter() {
    // not used in simplified UI
  }

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

  removeSiteFilter() {
    this.activeSite = null;
    this.filters.site = '';
  }

  removeSimilarFilter() {
    this.activeSimilar = null;
    this.filters.similar = '';
  }

  hasActiveFilters(): boolean {
    return !!(
      this.activeSite ||
      this.activeSimilar ||
      this.excludeWords.length ||
      this.exactWords.length ||
      this.fileTypesSelected.length
    );
  }

  trackByLink(index: number, item: any) {
    return item.link;
  }
}
