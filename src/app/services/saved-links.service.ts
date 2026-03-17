import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { AuthStateService } from './auth-state.service';
import { environment } from '../environments/environment';

export interface SavedLink {
  url: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const MAX_SAVED_LINKS = 500;

@Injectable({ providedIn: 'root' })
export class SavedLinksService {
  private readonly apiUrl = environment.apiUrl;
  private readonly linksSubject = new BehaviorSubject<SavedLink[]>([]);
  readonly links$ = this.linksSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly authState: AuthStateService,
  ) {
    combineLatest([this.authState.user$, this.authState.token$]).subscribe(([_user, token]) => {
      if (!token) {
        this.linksSubject.next([]);
        return;
      }

      this.refreshFromApi();
    });
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated();
  }

  isSaved(url: string): boolean {
    const normalized = this.normalizeUrl(url);
    if (!normalized) return false;
    return this.linksSubject.value.some((l) => l.url === normalized);
  }

  add(url: string, title?: string): { ok: true } | { ok: false; reason: string } {
    if (!this.authState.isAuthenticated()) {
      return { ok: false, reason: 'AUTH_REQUIRED' };
    }

    const normalizedUrl = this.normalizeUrl(url);
    if (!normalizedUrl) return { ok: false, reason: 'INVALID_URL' };

    const now = new Date().toISOString();
    const nextTitle = (title ?? '').trim() || this.defaultTitleFromUrl(normalizedUrl);

    const current = this.linksSubject.value;
    const existing = current.find((l) => l.url === normalizedUrl);

    const next: SavedLink[] = existing
      ? current.map((l) =>
          l.url === normalizedUrl
            ? { ...l, title: nextTitle || l.title, updatedAt: now }
            : l,
        )
      : [{ url: normalizedUrl, title: nextTitle, createdAt: now, updatedAt: now }, ...current];

    const trimmed = next.slice(0, MAX_SAVED_LINKS);
    this.linksSubject.next(trimmed);
    this.persistToApi(normalizedUrl, nextTitle);
    return { ok: true };
  }

  remove(url: string): { ok: true } | { ok: false; reason: string } {
    if (!this.authState.isAuthenticated()) return { ok: false, reason: 'AUTH_REQUIRED' };

    const normalizedUrl = this.normalizeUrl(url);
    if (!normalizedUrl) return { ok: false, reason: 'INVALID_URL' };

    const next = this.linksSubject.value.filter((l) => l.url !== normalizedUrl);
    this.linksSubject.next(next);
    this.removeFromApi(normalizedUrl);
    return { ok: true };
  }

  toggle(url: string, title?: string): { ok: true; saved: boolean } | { ok: false; reason: string } {
    if (!this.authState.isAuthenticated()) return { ok: false, reason: 'AUTH_REQUIRED' };
    if (this.isSaved(url)) {
      const res = this.remove(url);
      if (!res.ok) return res;
      return { ok: true, saved: false };
    }
    const res = this.add(url, title);
    if (!res.ok) return res;
    return { ok: true, saved: true };
  }

  updateTitle(url: string, title: string): { ok: true } | { ok: false; reason: string } {
    if (!this.authState.isAuthenticated()) return { ok: false, reason: 'AUTH_REQUIRED' };

    const normalizedUrl = this.normalizeUrl(url);
    if (!normalizedUrl) return { ok: false, reason: 'INVALID_URL' };

    const nextTitle = title.trim();
    if (!nextTitle) return { ok: false, reason: 'EMPTY_TITLE' };

    const now = new Date().toISOString();
    const next = this.linksSubject.value.map((l) =>
      l.url === normalizedUrl ? { ...l, title: nextTitle, updatedAt: now } : l,
    );
    this.linksSubject.next(next);
    this.updateTitleInApi(normalizedUrl, nextTitle);
    return { ok: true };
  }

  private normalizeSavedLink(value: unknown): SavedLink | null {
    if (!value || typeof value !== 'object') return null;
    const v = value as any;

    const url = typeof v.url === 'string' ? this.normalizeUrl(v.url) : null;
    const title = typeof v.title === 'string' ? v.title.trim() : '';
    const createdAt = typeof v.createdAt === 'string' ? v.createdAt : '';
    const updatedAt = typeof v.updatedAt === 'string' ? v.updatedAt : '';

    if (!url) return null;
    if (!title) return null;

    const now = new Date().toISOString();
    return {
      url,
      title,
      createdAt: createdAt || now,
      updatedAt: updatedAt || createdAt || now,
    };
  }

  private normalizeUrl(url: string): string | null {
    const input = (url || '').trim();
    if (!input) return null;

    try {
      const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`;
      const parsed = new URL(withScheme);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
      return parsed.href;
    } catch {
      return null;
    }
  }

  private defaultTitleFromUrl(url: string): string {
    try {
      const u = new URL(url);
      return u.hostname || url;
    } catch {
      return url;
    }
  }

  private mergeUniqueByUrl(a: SavedLink[], b: SavedLink[]): SavedLink[] {
    const map = new Map<string, SavedLink>();
    for (const item of [...b, ...a]) {
      map.set(item.url, item);
    }
    return Array.from(map.values()).sort((x, y) => (x.updatedAt < y.updatedAt ? 1 : -1));
  }

  private refreshFromApi(): void {
    if (!this.authState.isAuthenticated()) return;

    this.http.get<{ items: SavedLink[] }>(`${this.apiUrl}/user/saved-links`).subscribe({
      next: (res) => {
        const items = Array.isArray(res?.items) ? res.items : [];
        const normalized = items
          .map((item) => this.normalizeSavedLink(item))
          .filter((item): item is SavedLink => item !== null)
          .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
          .slice(0, MAX_SAVED_LINKS);

        this.linksSubject.next(normalized);
      },
      error: (_err: unknown) => {},
    });
  }

  private persistToApi(url: string, title: string): void {
    if (!this.authState.isAuthenticated()) return;

    this.http.post<{ saved: boolean; item?: SavedLink }>(`${this.apiUrl}/user/saved-links`, { url, title }).subscribe({
      next: (res) => {
        const item = this.normalizeSavedLink(res?.item);
        if (!item) {
          this.refreshFromApi();
          return;
        }

        const existing = this.linksSubject.value.filter((l) => l.url !== item.url);
        this.linksSubject.next([item, ...existing].slice(0, MAX_SAVED_LINKS));
      },
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          this.refreshFromApi();
        }
      },
    });
  }

  private updateTitleInApi(url: string, title: string): void {
    if (!this.authState.isAuthenticated()) return;

    this.http.patch(`${this.apiUrl}/user/saved-links`, { url, title }).subscribe({
      next: () => {
        this.refreshFromApi();
      },
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          this.refreshFromApi();
        }
      },
    });
  }

  private removeFromApi(url: string): void {
    if (!this.authState.isAuthenticated()) return;

    const params = new HttpParams().set('url', url);
    this.http.delete(`${this.apiUrl}/user/saved-links`, { params }).subscribe({
      next: () => {
        this.refreshFromApi();
      },
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          this.refreshFromApi();
        }
      },
    });
  }
}
