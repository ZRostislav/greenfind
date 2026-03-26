import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface AdminSummary {
  totalSearches: number;
  uniqueSearchUsers: number;
  totalClicks: number;
  uniqueClickUsers: number;
  totalImpressions?: number;
  noClickSearches?: number;
  noClickRate?: number;
  repeatSearches24h?: number;
  repeatSearchRate?: number;
  webSearches?: number;
  imageSearches?: number;
}

export interface AdminTopItem {
  query?: string;
  domain?: string;
  count: number;
}

export interface AdminDailyItem {
  day: string;
  count: number;
}

export interface AdminModeBreakdownItem {
  mode: string;
  count: number;
  users: number | null;
}

export interface AdminFunnel {
  totalSearches: number;
  totalImpressions: number;
  totalClicks: number;
  searchesWithClicks: number;
  noClickSearches: number;
  noClickRate: number;
  repeatSearches24h: number;
  repeatSearchRate: number;
  ctrSearchToClick: number;
}

export interface AdminCtrPositionItem {
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface AdminRetention {
  cohortSize: number;
  retainedD1: number;
  retainedD7: number;
  d1Rate: number;
  d7Rate: number;
}

export interface AdminOverviewResponse {
  summary: AdminSummary;
  topQueries: AdminTopItem[];
  dailyTrend: AdminDailyItem[];
  topSites: AdminTopItem[];
  modeBreakdown?: AdminModeBreakdownItem[];
  funnel?: AdminFunnel;
  ctrByPosition?: AdminCtrPositionItem[];
  retention?: AdminRetention;
}

export interface AdminUserItem {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  searchesCount: number;
  clicksCount: number;
}

export interface AdminReportItem {
  id: number;
  createdByUserId: number;
  createdByUsername: string | null;
  reportType: string;
  outputFormat: string;
  periodFrom: string | null;
  periodTo: string | null;
  status: string;
  fileName: string | null;
  errorMessage: string | null;
  createdAt: string;
  readyAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  fetchOverview(params?: { from?: string; to?: string; limit?: number; days?: number }): Observable<AdminOverviewResponse> {
    let httpParams = new HttpParams();
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.days) httpParams = httpParams.set('days', String(params.days));

    return this.http.get<AdminOverviewResponse>(`${this.apiUrl}/admin/analytics/overview`, {
      params: httpParams,
    });
  }

  fetchUsers(params?: { q?: string; limit?: number; offset?: number }): Observable<{ items: AdminUserItem[] }> {
    let httpParams = new HttpParams();
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.offset) httpParams = httpParams.set('offset', String(params.offset));

    return this.http.get<{ items: AdminUserItem[] }>(`${this.apiUrl}/admin/users`, {
      params: httpParams,
    });
  }

  deleteUser(userId: number): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/admin/users/${userId}`);
  }

  updateUserRole(userId: number, role: 'user' | 'admin'): Observable<{ updated: boolean }> {
    return this.http.patch<{ updated: boolean }>(`${this.apiUrl}/admin/users/${userId}/role`, { role });
  }

  fetchReports(params?: { limit?: number; offset?: number }): Observable<{ items: AdminReportItem[] }> {
    let httpParams = new HttpParams();
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.offset) httpParams = httpParams.set('offset', String(params.offset));

    return this.http.get<{ items: AdminReportItem[] }>(`${this.apiUrl}/admin/reports`, {
      params: httpParams,
    });
  }

  getReportExportUrl(params: {
    type: 'search_stats' | 'top_queries' | 'daily_trend' | 'top_sites';
    format: 'json' | 'csv';
    from?: string;
    to?: string;
    limit?: number;
    days?: number;
  }): string {
    let httpParams = new HttpParams().set('type', params.type).set('format', params.format);
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.days) httpParams = httpParams.set('days', String(params.days));
    return `${this.apiUrl}/admin/reports/export?${httpParams.toString()}`;
  }

  exportReport(params: {
    type: 'search_stats' | 'top_queries' | 'daily_trend' | 'top_sites';
    format: 'json' | 'csv';
    from?: string;
    to?: string;
    limit?: number;
    days?: number;
  }): Observable<Blob> {
    let httpParams = new HttpParams().set('type', params.type).set('format', params.format);
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.days) httpParams = httpParams.set('days', String(params.days));

    return this.http.get(`${this.apiUrl}/admin/reports/export`, {
      params: httpParams,
      responseType: 'blob',
    });
  }
}
