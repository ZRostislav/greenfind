// src/app/services/search.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface SearchFilters {
  query: string;
  mode?: 'web' | 'images';
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

export interface AiOverviewSource {
  title: string;
  link: string;
}

export interface AiOverview {
  title: string;
  summary: string | null;
  points: string[];
  sources: AiOverviewSource[];
}

export interface ImageResult {
  title: string | null;
  source: string | null;
  thumbnail: string;
  original: string;
  sourceLink: string | null;
  link: string;
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
  private _aiOverview = new BehaviorSubject<AiOverview | null>(null);
  private _imageResults = new BehaviorSubject<ImageResult[]>([]);

  results$ = this._results.asObservable();
  loading$ = this._loading.asObservable();
  error$ = this._error.asObservable();
  filters$ = this._filters.asObservable();
  relatedSearches$ = this._relatedSearches.asObservable();
  pagination$ = this._pagination.asObservable();
  knowledgeGraph$ = this._knowledgeGraph.asObservable();
  aiOverview$ = this._aiOverview.asObservable();
  imageResults$ = this._imageResults.asObservable();

  constructor(private http: HttpClient) {}

  search(filters: SearchFilters, options?: { appendImages?: boolean }): void {
    const normalizedFilters = this.normalizeFilters(filters);
    const appendImages = !!options?.appendImages && normalizedFilters.mode === 'images';
    this.setFilters(normalizedFilters);

    if (!normalizedFilters.query) {
      this._results.next([]);
      this._relatedSearches.next([]);
      this._pagination.next(null);
      return;
    }

    if (!appendImages) {
      this.clear();
    } else {
      this._loading.next(true);
      this._error.next(null);
    }

    const q = this.buildQuery(normalizedFilters);
    let params = new HttpParams().set('q', q);
    if (normalizedFilters.mode) params = params.set('mode', normalizedFilters.mode);

    if (normalizedFilters.country) params = params.set('country', normalizedFilters.country);
    if (normalizedFilters.city) params = params.set('city', normalizedFilters.city);
    if (normalizedFilters.mode === 'web' && normalizedFilters.page && normalizedFilters.page > 1) {
      params = params.set('start', ((normalizedFilters.page - 1) * 10).toString());
    }
    if (normalizedFilters.mode === 'images' && normalizedFilters.page && normalizedFilters.page > 1) {
      params = params.set('page', String(normalizedFilters.page));
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
          this._aiOverview.next(this.normalizeAiOverview(res.ai_overview));
          const incomingImages = this.normalizeImageResults(res.image_results);
          if (appendImages) {
            const merged = [...this._imageResults.value, ...incomingImages];
            const deduped = merged.filter(
              (item, index, arr) =>
                arr.findIndex((candidate) => candidate.original === item.original) === index,
            );
            this._imageResults.next(deduped);
          } else {
            this._imageResults.next(incomingImages);
          }
          this._pagination.next(res.pagination || null);
        }),
        catchError((err) => {
          console.error(err);
          this._error.next('Search failed');
          this._results.next([]);
          this._relatedSearches.next([]);
          this._knowledgeGraph.next(null);
          this._aiOverview.next(null);
          this._imageResults.next([]);
          this._pagination.next(null);
          return of({
            results: [],
            image_results: [],
            related_searches: [],
            knowledge_graph: null,
            ai_overview: null,
            pagination: null,
          });
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
    this._aiOverview.next(null);
    this._imageResults.next([]);
    this._pagination.next(null);
    this._error.next(null);
  }

  private normalizeImageResults(value: any): ImageResult[] {
    if (!Array.isArray(value)) return [];

    return value
      .map((item: any) => {
        const thumbnail = this.normalizeText(item?.thumbnail);
        const link = this.normalizeText(item?.link);
        if (!thumbnail || !link) return null;

        return {
          title: this.normalizeText(item?.title) ?? null,
          source: this.normalizeText(item?.source) ?? null,
          thumbnail,
          original: this.normalizeText(item?.original) || thumbnail,
          sourceLink: this.normalizeText(item?.source_link) ?? null,
          link,
        };
      })
      .filter((item: ImageResult | null): item is ImageResult => item !== null);
  }

  private normalizeAiOverview(value: any): AiOverview | null {
    if (!value || typeof value !== 'object') return null;

    const title = this.normalizeText(value.title) || 'AI Overview';
    const summary = this.normalizeText(value.summary) ?? null;
    const points = this.normalizeStringList(value.points);

    const sources = Array.isArray(value.sources)
      ? value.sources
          .map((item: any) => {
            const sourceTitle = this.normalizeText(item?.title);
            const link = this.normalizeText(item?.link);
            if (!sourceTitle || !link) return null;
            return { title: sourceTitle, link };
          })
          .filter((item: AiOverviewSource | null): item is AiOverviewSource => item !== null)
      : [];

    if (!summary && !points.length && !sources.length) return null;

    return {
      title,
      summary,
      points,
      sources,
    };
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
      mode: filters.mode === 'images' ? 'images' : 'web',
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
