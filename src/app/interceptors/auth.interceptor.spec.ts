import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../environments/environment';
import { AuthStateService, User } from '../services/auth-state.service';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authState: AuthStateService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthStateService,
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authState = TestBed.inject(AuthStateService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds Authorization header for API requests when token exists', () => {
    authState.setToken('jwt-token');

    http.get(`${environment.apiUrl}/user/me`).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/user/me`);

    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush({ user: {} });
  });

  it('does not add Authorization header for non-API requests', () => {
    authState.setToken('jwt-token');

    http.get('https://example.com/public').subscribe();
    const req = httpMock.expectOne('https://example.com/public');

    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('clears session when API returns 401', (done) => {
    const mockUser: User = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      authProvider: 'local',
      emailVerified: true,
      role: 'admin',
      allowAdultContent: true,
      createdAt: '2026-03-26T00:00:00.000Z',
    };

    authState.setToken('jwt-token');
    authState.setUser(mockUser);

    http.get(`${environment.apiUrl}/user/me`).subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
        expect(authState.accessToken).toBeNull();
        expect(authState.user).toBeNull();
        done();
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/user/me`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });
});
