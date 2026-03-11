import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AuthStateService, User } from './auth-state.service';

export interface SearchHistoryItem {
  id: number;
  searchId: number;
  query: string;
  region: string | null;
  language: string | null;
  siteFilter: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  readonly token$: Observable<string | null>;
  readonly user$: Observable<User | null>;

  constructor(
    private readonly http: HttpClient,
    private readonly state: AuthStateService,
  ) {
    this.token$ = this.state.token$;
    this.user$ = this.state.user$;
    if (this.state.accessToken) this.fetchMe().subscribe();
  }

  get accessToken(): string | null {
    return this.state.accessToken;
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated();
  }

  setPendingEmail(email: string | null) {
    this.state.setPendingEmail(email);
  }

  getPendingEmail(): string | null {
    return this.state.getPendingEmail();
  }

  register(payload: { username: string; email: string; password: string }): Observable<User> {
    return this.http.post<{ user: User }>(`${this.apiUrl}/auth/register`, payload).pipe(
      tap(() => this.setPendingEmail(payload.email)),
      map((res) => res.user),
    );
  }

  verifyEmail(payload: { email: string; code: string }): Observable<{ verified: boolean }> {
    return this.http.post<{ verified: boolean }>(`${this.apiUrl}/auth/verify-email`, payload).pipe(
      tap(() => this.setPendingEmail(null)),
    );
  }

  resendVerificationCode(payload: { email: string }): Observable<{ sent: boolean }> {
    return this.http.post<{ sent: boolean }>(`${this.apiUrl}/auth/resend-code`, payload);
  }

  login(payload: { email: string; password: string }): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/auth/login`, payload).pipe(
      tap((res) => this.state.setToken(res.accessToken)),
    );
  }

  logout(): Observable<{ loggedOut: boolean }> {
    if (!this.state.accessToken) {
      this.state.clearSession();
      return of({ loggedOut: true });
    }

    return this.http.post<{ loggedOut: boolean }>(`${this.apiUrl}/auth/logout`, {}).pipe(
      catchError(() => of({ loggedOut: true })),
      finalize(() => this.state.clearSession()),
    );
  }

  requestPasswordReset(payload: { email: string }): Observable<{ sent: boolean }> {
    return this.http.post<{ sent: boolean }>(`${this.apiUrl}/auth/request-password-reset`, payload);
  }

  resetPassword(payload: {
    email: string;
    code: string;
    newPassword: string;
  }): Observable<{ reset: boolean }> {
    return this.http.post<{ reset: boolean }>(`${this.apiUrl}/auth/reset-password`, payload);
  }

  fetchMe(): Observable<User> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/user/me`).pipe(
      tap((res) => this.state.setUser(res.user)),
      map((res) => res.user),
      catchError((err) => {
        this.state.clearSession();
        return throwError(() => err);
      }),
    );
  }

  fetchSearchHistory(params?: { limit?: number; offset?: number }): Observable<SearchHistoryItem[]> {
    let httpParams = new HttpParams();
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.offset) httpParams = httpParams.set('offset', String(params.offset));

    return this.http
      .get<{ items: SearchHistoryItem[] }>(`${this.apiUrl}/user/search-history`, {
        params: httpParams,
      })
      .pipe(map((res) => res.items || []));
  }

  clearSession() {
    this.state.clearSession();
  }

  setToken(token: string | null) {
    this.state.setToken(token);
  }
}
