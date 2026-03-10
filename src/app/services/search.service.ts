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
  page?: number;
}

export interface KnowledgeGraphFact {
  label: string;
  value: string;
}

export interface KnowledgeGraphSource {
  name: string | null;
  link: string | null;
}

export interface KnowledgeGraphRelation {
  name: string;
  link: string | null;
  image: string | null;
  type: string | null;
}

export interface KnowledgeGraph {
  title: string | null;
  type: string | null;
  description: string | null;
  image: string | null;
  images: string[];
  source: KnowledgeGraphSource | null;
  sources: string[];
  sursele_includ: string[];
  facts: KnowledgeGraphFact[];
  people_also_search_for: KnowledgeGraphRelation[];
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
  private _relatedSearches = new BehaviorSubject<any[]>([]);
  private _pagination = new BehaviorSubject<any>(null);
  private _knowledgeGraph = new BehaviorSubject<KnowledgeGraph | null>(null);

  results$ = this._results.asObservable();
  loading$ = this._loading.asObservable();
  error$ = this._error.asObservable();
  filters$ = this._filters.asObservable();
  relatedSearches$ = this._relatedSearches.asObservable();
  pagination$ = this._pagination.asObservable();
  knowledgeGraph$ = this._knowledgeGraph.asObservable();

  constructor(private http: HttpClient) {}

  search(filters: SearchFilters): void {
    const normalizedFilters = this.normalizeFilters(filters);
    this.setFilters(normalizedFilters);

    if (!normalizedFilters.query) {
      this._results.next([]);
      this._relatedSearches.next([]);
      this._pagination.next(null);
      return;
    }

    this.clear();

    const q = this.buildQuery(normalizedFilters);
    let params = new HttpParams().set('q', q);

    if (normalizedFilters.country) params = params.set('country', normalizedFilters.country);
    if (normalizedFilters.city) params = params.set('city', normalizedFilters.city);
    if (normalizedFilters.page && normalizedFilters.page > 1) {
      params = params.set('start', ((normalizedFilters.page - 1) * 10).toString());
    }

    this._loading.next(true);
    this._error.next(null);

    this.http
      .get<any>(`${this.apiUrl}/search`, { params })
      .pipe(
        tap((res) => {
          this._results.next(res.results || []);
          this._relatedSearches.next(res.related_searches || []);
          this._knowledgeGraph.next(this.normalizeKnowledgeGraph(res.knowledge_graph));
          this._pagination.next(res.pagination || null);
        }),
        catchError((err) => {
          console.error(err);
          this._error.next('Search failed');
          this._results.next([]);
          this._relatedSearches.next([]);
          this._knowledgeGraph.next(null);
          this._pagination.next(null);
          return of({ results: [], related_searches: [], knowledge_graph: null, pagination: null });
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
    this._relatedSearches.next([]);
    this._knowledgeGraph.next(null);
    this._pagination.next(null);
    this._error.next(null);
  }

  private normalizeKnowledgeGraph(value: any): KnowledgeGraph | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const images = this.normalizeStringList(value.images);
    const image = this.normalizeText(value.image) ?? images[0] ?? null;
    const sources = Array.isArray(value.sources)
      ? this.normalizeStringList(value.sources)
      : [];
    const surseleInclud = Array.isArray(value.sursele_includ)
      ? this.normalizeStringList(value.sursele_includ)
      : [];

    const facts = Array.isArray(value.facts)
      ? value.facts
          .map((fact: any) => ({
            label: this.normalizeText(fact?.label),
            value: this.normalizeText(fact?.value),
          }))
          .filter(
            (fact: { label?: string; value?: string }): fact is KnowledgeGraphFact =>
              typeof fact.label === 'string' && typeof fact.value === 'string',
          )
      : [];

    const peopleAlsoSearchFor = Array.isArray(value.people_also_search_for)
      ? value.people_also_search_for
          .map((item: any) => {
            const name = this.normalizeText(item?.name);
            if (!name) return null;

            return {
              name,
              link: this.normalizeText(item?.link) ?? null,
              image: this.normalizeText(item?.image) ?? null,
              type: this.normalizeText(item?.type) ?? null,
            };
          })
          .filter((item: KnowledgeGraphRelation | null): item is KnowledgeGraphRelation => item !== null)
      : [];

    const source =
      value.source && typeof value.source === 'object'
        ? {
            name: this.normalizeText(value.source.name) ?? null,
            link: this.normalizeText(value.source.link) ?? null,
          }
        : null;

    return {
      title: this.normalizeText(value.title) ?? null,
      type: this.normalizeText(value.type) ?? null,
      description: this.normalizeText(value.description) ?? null,
      image,
      images: image ? [image, ...images.filter((item) => item !== image)] : images,
      source: source?.name || source?.link ? source : null,
      sources,
      sursele_includ: surseleInclud,
      facts,
      people_also_search_for: peopleAlsoSearchFor,
    };
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
      page: filters.page || 1,
    };
  }

  private normalizeText(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeDomain(value?: string): string | undefined {
    const normalized = this.normalizeText(value);
    if (!normalized) return undefined;

    return normalized
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .toLowerCase();
  }

  private normalizeList(values?: string[]): string[] | undefined {
    if (!values?.length) return undefined;

    const normalized = values.map((item) => item.trim()).filter((item) => item.length > 0);
    if (!normalized.length) return undefined;

    return Array.from(new Set(normalized));
  }

  private normalizeStringList(values?: unknown[]): string[] {
    if (!Array.isArray(values)) return [];

    return Array.from(
      new Set(
        values
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0),
      ),
    );
  }
}
