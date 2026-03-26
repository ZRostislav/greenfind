import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { environment } from '../environments/environment';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminService, provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetchUsers sends query, role, limit and offset params', () => {
    service
      .fetchUsers({
        q: 'alice',
        role: 'admin',
        limit: 20,
        offset: 40,
      })
      .subscribe((res) => {
        expect(res.totalFiltered).toBe(1);
        expect(res.totalAccounts).toBe(7);
      });

    const req = httpMock.expectOne((request) => request.url === `${environment.apiUrl}/admin/users`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('alice');
    expect(req.request.params.get('role')).toBe('admin');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.get('offset')).toBe('40');

    req.flush({ items: [], totalFiltered: 1, totalAccounts: 7 });
  });

  it('fetchUsers skips role param when role=all', () => {
    service.fetchUsers({ q: 'john', role: 'all', limit: 10, offset: 0 }).subscribe();

    const req = httpMock.expectOne((request) => request.url === `${environment.apiUrl}/admin/users`);
    expect(req.request.params.get('q')).toBe('john');
    expect(req.request.params.has('role')).toBeFalse();
    req.flush({ items: [], totalFiltered: 0, totalAccounts: 0 });
  });

  it('getReportExportUrl builds URL with optional params', () => {
    const url = service.getReportExportUrl({
      type: 'top_queries',
      format: 'csv',
      from: '2026-03-01',
      to: '2026-03-26',
      limit: 15,
      days: 14,
    });

    expect(url.startsWith(`${environment.apiUrl}/admin/reports/export?`)).toBeTrue();
    expect(url).toContain('type=top_queries');
    expect(url).toContain('format=csv');
    expect(url).toContain('from=2026-03-01');
    expect(url).toContain('to=2026-03-26');
    expect(url).toContain('limit=15');
    expect(url).toContain('days=14');
  });
});
