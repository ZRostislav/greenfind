// src/app/services/search.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, finalize, debounceTime, switchMap } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly apiUrl = environment.apiUrl;

  private _results = new BehaviorSubject<any[]>([]);
  private _loading = new BehaviorSubject<boolean>(false);
  private _error = new BehaviorSubject<string | null>(null);

  results$ = this._results.asObservable();
  loading$ = this._loading.asObservable();
  error$ = this._error.asObservable();

  constructor(private http: HttpClient) {}

  search(filters: SearchFilters): void {
    if (!filters.query?.trim()) {
      this._results.next([]);
      return;
    }

    const q = this.buildQuery(filters);

    let params = new HttpParams().set('q', q);

    if (filters.country) params = params.set('country', filters.country);
    if (filters.city) params = params.set('city', filters.city);

    console.log('🔍 Performing search:', params.toString());

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

  clear() {
    this._results.next([]);
    this._error.next(null);
  }
}
