import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  authProvider: 'local' | 'google' | 'github' | string;
  emailVerified: boolean;
  createdAt: string;
}

const TOKEN_KEY = 'greenfind.accessToken';
const PENDING_EMAIL_KEY = 'greenfind.pendingEmail';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly tokenSubject = new BehaviorSubject<string | null>(this.loadToken());
  readonly token$ = this.tokenSubject.asObservable();

  private readonly userSubject = new BehaviorSubject<User | null>(null);
  readonly user$ = this.userSubject.asObservable();

  get accessToken(): string | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  setToken(token: string | null) {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) window.localStorage.setItem(TOKEN_KEY, token);
      else window.localStorage.removeItem(TOKEN_KEY);
    }
    this.tokenSubject.next(token);
  }

  setUser(user: User | null) {
    this.userSubject.next(user);
  }

  clearSession() {
    this.setToken(null);
    this.setUser(null);
  }

  setPendingEmail(email: string | null) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (!email) {
      window.localStorage.removeItem(PENDING_EMAIL_KEY);
      return;
    }
    window.localStorage.setItem(PENDING_EMAIL_KEY, email);
  }

  getPendingEmail(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(PENDING_EMAIL_KEY);
  }

  private loadToken(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(TOKEN_KEY);
  }
}

