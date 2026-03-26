import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AuthStateService, User } from './auth-state.service';

const TOKEN_KEY = 'greenfind.accessToken';
const PENDING_EMAIL_KEY = 'greenfind.pendingEmail';

describe('AuthStateService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('loads token from localStorage on initialization', () => {
    localStorage.setItem(TOKEN_KEY, 'seed-token');
    const service = TestBed.inject(AuthStateService);

    expect(service.accessToken).toBe('seed-token');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('persists and removes token in localStorage', () => {
    const service = TestBed.inject(AuthStateService);

    service.setToken('abc-token');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc-token');

    service.setToken(null);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(service.accessToken).toBeNull();
  });

  it('clearSession resets token and user', () => {
    const service = TestBed.inject(AuthStateService);
    const mockUser: User = {
      id: 1,
      username: 'tester',
      email: 'tester@example.com',
      authProvider: 'local',
      emailVerified: true,
      allowAdultContent: false,
      role: 'user',
      createdAt: '2026-03-26T00:00:00.000Z',
    };

    service.setToken('abc-token');
    service.setUser(mockUser);
    service.clearSession();

    expect(service.accessToken).toBeNull();
    expect(service.user).toBeNull();
  });

  it('stores and clears pending email', () => {
    const service = TestBed.inject(AuthStateService);

    service.setPendingEmail('mail@example.com');
    expect(service.getPendingEmail()).toBe('mail@example.com');
    expect(localStorage.getItem(PENDING_EMAIL_KEY)).toBe('mail@example.com');

    service.setPendingEmail(null);
    expect(service.getPendingEmail()).toBeNull();
    expect(localStorage.getItem(PENDING_EMAIL_KEY)).toBeNull();
  });
});
