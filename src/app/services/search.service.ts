// src/app/services/search.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface SearchFilters {
  query: string;
  country?: string;
  city?: string;
  site?: string;
  similar?: string;
  exclude?: string[];
  exact?: string[];
  fileTypes?: string[];
}

const FILTERS_STORAGE_KEY = 'greenfind.search-filters';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly apiUrl = environment.apiUrl;

  private _results = new BehaviorSubject<any[]>([]);
  private _loading = new BehaviorSubject<boolean>(false);
  private _error = new BehaviorSubject<string | null>(null);
  private _filters = new BehaviorSubject<SearchFilters>(this.loadSavedFilters());

  results$ = this._results.asObservable();
  loading$ = this._loading.asObservable();
  error$ = this._error.asObservable();
  filters$ = this._filters.asObservable();

  constructor(private http: HttpClient) {}

  search(filters: SearchFilters): void {
    const normalizedFilters = this.normalizeFilters(filters);
    this.setFilters(normalizedFilters);

    if (!normalizedFilters.query) {
      this._results.next([]);
      return;
    }

    const q = this.buildQuery(normalizedFilters);
    let params = new HttpParams().set('q', q);

    if (normalizedFilters.country) params = params.set('country', normalizedFilters.country);
    if (normalizedFilters.city) params = params.set('city', normalizedFilters.city);

    this._loading.next(true);
    this._error.next(null);

    this.http
      .get<any[]>(`${this.apiUrl}/search`, { params })
      .pipe(
        tap((res) => this._results.next(res)),
        catchError((err) => {
          console.error(err);
          this._error.next('Search failed');
          return of([]);
        }),
        finalize(() => this._loading.next(false)),
      )
      .subscribe();
  }

  setFilters(filters: SearchFilters): void {
    const normalizedFilters = this.normalizeFilters(filters);
    this._filters.next(normalizedFilters);
    this.saveFilters(normalizedFilters);
  }

  getCurrentFilters(): SearchFilters {
    return this._filters.value;
  }

  hasResults(): boolean {
    return this._results.value.length > 0;
  }

  isLoading(): boolean {
    return this._loading.value;
  }

  clear(): void {
    this._results.next([]);
    this._error.next(null);
  }

  private buildQuery(filters: SearchFilters): string {
    let q = filters.query.trim();

    if (filters.site) {
      q += ` site:${filters.site}`;
    }

    if (filters.similar) {
      q += ` related:${filters.similar}`;
    }

    filters.exclude?.forEach((w) => {
      q += ` -${w}`;
    });

    filters.exact?.forEach((w) => {
      q += ` "${w}"`;
    });

    filters.fileTypes?.forEach((t) => {
      q += ` filetype:${t}`;
    });

    return q;
  }

  private loadSavedFilters(): SearchFilters {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { query: '' };
    }

    try {
      const saved = window.localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!saved) return { query: '' };

      const parsed = JSON.parse(saved) as SearchFilters;
      return this.normalizeFilters(parsed);
    } catch {
      return { query: '' };
    }
  }

  private saveFilters(filters: SearchFilters): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }

  private normalizeFilters(filters: SearchFilters): SearchFilters {
    return {
      query: (filters.query || '').trim(),
      country: this.normalizeText(filters.country)?.toLowerCase(),
      city: this.normalizeText(filters.city),
      site: this.normalizeDomain(filters.site),
      similar: this.normalizeDomain(filters.similar),
      exclude: this.normalizeList(filters.exclude),
      exact: this.normalizeList(filters.exact),
      fileTypes: this.normalizeList(filters.fileTypes)?.map((type) => type.toLowerCase()),
    };
  }

  private normalizeText(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeDomain(value?: string): string | undefined {
    const normalized = this.normalizeText(value);
    if (!normalized) return undefined;

    return normalized.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
  }

  private normalizeList(values?: string[]): string[] | undefined {
    if (!values?.length) return undefined;

    const normalized = values.map((item) => item.trim()).filter((item) => item.length > 0);
    if (!normalized.length) return undefined;

    return Array.from(new Set(normalized));
  }
}
