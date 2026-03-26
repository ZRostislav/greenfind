import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  AdminOverviewResponse,
  AdminSummary,
  AdminTopItem,
  AdminReportItem,
  AdminService,
  AdminUserItem,
} from '../../../services/admin.service';
import { AuthStateService } from '../../../services/auth-state.service';
import {
  AlertCircleIcon,
  BarChart3Icon,
  DownloadIcon,
  HistoryIcon,
  LucideAngularModule,
  RefreshCcwIcon,
  Search,
  ShieldIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-angular';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly ShieldIcon = ShieldIcon;
  readonly UserIcon = UserIcon;
  readonly HistoryIcon = HistoryIcon;
  readonly BarChart3Icon = BarChart3Icon;
  readonly RefreshCcwIcon = RefreshCcwIcon;
  readonly Trash2Icon = Trash2Icon;
  readonly DownloadIcon = DownloadIcon;
  readonly AlertCircleIcon = AlertCircleIcon;

  private readonly admin = inject(AdminService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  readonly me$ = this.authState.user$;
  private readonly numberFormatter = new Intl.NumberFormat('en-US');
  readonly loadingOverview = signal(true);
  readonly loadingUsers = signal(true);
  readonly loadingReports = signal(true);
  readonly deletingUserId = signal<number | null>(null);
  readonly roleUpdatingUserId = signal<number | null>(null);
  readonly exporting = signal(false);
  readonly error = signal<string | null>(null);

  readonly overview = signal<AdminOverviewResponse | null>(null);
  readonly users = signal<AdminUserItem[]>([]);
  readonly reports = signal<AdminReportItem[]>([]);

  fromDate = '';
  toDate = '';
  userQuery = '';

  reportType: 'search_stats' | 'top_queries' | 'daily_trend' | 'top_sites' = 'top_queries';
  reportFormat: 'json' | 'csv' = 'csv';
  customReportTitle = 'GreenFind analytics report';
  customReportFormat: CustomReportFormat = 'pdf';
  customTopLimit = 10;
  customIncludeCharts = true;
  readonly customExporting = signal(false);
  readonly customSectionOptions: readonly CustomReportSectionOption[] = [
    { key: 'summary', label: 'Summary KPIs', description: 'Searches, users, and site clicks totals.' },
    { key: 'engagement', label: 'Engagement', description: 'CTR and active click-user ratio.' },
    { key: 'modeBreakdown', label: 'Mode split', description: 'Web/Image and other mode usage.' },
    { key: 'dailyTrend', label: 'Daily trend', description: 'Timeline of search activity by day.' },
    { key: 'topQueries', label: 'Top queries', description: 'Most frequent user search phrases.' },
    { key: 'topSites', label: 'Top sites', description: 'Domains with highest click count.' },
    { key: 'users', label: 'User activity', description: 'Top users by searches and clicks.' },
    { key: 'recentExports', label: 'Recent exports', description: 'Latest generated report files.' },
  ];
  readonly customSections = signal<CustomReportSections>({
    summary: true,
    engagement: true,
    modeBreakdown: true,
    dailyTrend: true,
    topQueries: true,
    topSites: true,
    users: false,
    recentExports: false,
  });

  readonly summaryCards = computed(() => {
    const summary = this.overview()?.summary;
    if (!summary) return [];

    return [
      { label: 'Total searches', value: summary.totalSearches },
      { label: 'Unique search users', value: summary.uniqueSearchUsers },
      { label: 'Total site clicks', value: summary.totalClicks },
      { label: 'Unique click users', value: summary.uniqueClickUsers },
    ];
  });

  readonly topQueryBars = computed(() => this.toRankBars(this.overview()?.topQueries ?? [], (item) => item.query || '-'));
  readonly topSiteBars = computed(() => this.toRankBars(this.overview()?.topSites ?? [], (item) => item.domain || '-'));
  readonly dailyTrendChart = computed<DailyTrendChartModel>(() => this.createDailyTrendChart(this.overview()?.dailyTrend ?? []));
  readonly modeBreakdown = computed<SearchModeBreakdownItem[]>(() => {
    const metrics = this.extractModeMetrics(this.overview());
    if (!metrics.length) return [];

    const total = metrics.reduce((sum, item) => sum + item.count, 0);
    return metrics
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        mode: item.mode,
        label: this.formatModeLabel(item.mode),
        count: item.count,
        users: item.users,
        share: total ? Number(((item.count / total) * 100).toFixed(1)) : 0,
        gradientClass: this.getModeGradientClass(item.mode),
      }));
  });
  readonly usageCards = computed<UsageStatCard[]>(() => {
    const summary = this.overview()?.summary;
    const modeSplit = this.modeBreakdown();
    const webSearches = modeSplit.find((item) => item.mode === 'web')?.count ?? null;
    const imageSearches = modeSplit.find((item) => item.mode === 'images')?.count ?? null;

    return [
      {
        label: 'People used search',
        value: summary?.uniqueSearchUsers ?? null,
        hint: 'Unique users who started at least one search.',
      },
      {
        label: 'Web searches',
        value: webSearches,
        hint: webSearches === null ? 'Mode split is not returned by API yet.' : 'Standard search mode usage.',
      },
      {
        label: 'Image searches',
        value: imageSearches,
        hint: imageSearches === null ? 'Mode split is not returned by API yet.' : 'Users searched photos/images.',
      },
      {
        label: 'Site visits',
        value: summary?.totalClicks ?? null,
        hint: 'Total clicks on result links.',
      },
      {
        label: 'People visited sites',
        value: summary?.uniqueClickUsers ?? null,
        hint: 'Unique users with at least one click.',
      },
    ];
  });
  readonly engagementCard = computed(() => {
    const summary = this.overview()?.summary;
    if (!summary) {
      return {
        clickRate: 0,
        activeUserRate: 0,
        totalSearches: 0,
        totalClicks: 0,
        uniqueSearchUsers: 0,
        uniqueClickUsers: 0,
      };
    }

    const clickRate = summary.totalSearches ? (summary.totalClicks / summary.totalSearches) * 100 : 0;
    const activeUserRate = summary.uniqueSearchUsers ? (summary.uniqueClickUsers / summary.uniqueSearchUsers) * 100 : 0;

    return {
      clickRate: Math.min(100, Number(clickRate.toFixed(1))),
      activeUserRate: Math.min(100, Number(activeUserRate.toFixed(1))),
      totalSearches: summary.totalSearches,
      totalClicks: summary.totalClicks,
      uniqueSearchUsers: summary.uniqueSearchUsers,
      uniqueClickUsers: summary.uniqueClickUsers,
    };
  });
  readonly funnelCard = computed(() => {
    const summary = this.overview()?.summary;
    const funnel = this.overview()?.funnel;
    if (!summary && !funnel) return null;

    const totalSearches = funnel?.totalSearches ?? summary?.totalSearches ?? 0;
    const totalImpressions = funnel?.totalImpressions ?? summary?.totalImpressions ?? 0;
    const totalClicks = funnel?.totalClicks ?? summary?.totalClicks ?? 0;
    const noClickSearches =
      funnel?.noClickSearches ??
      summary?.noClickSearches ??
      Math.max(totalSearches - totalClicks, 0);
    const noClickRate =
      funnel?.noClickRate ??
      summary?.noClickRate ??
      (totalSearches ? (noClickSearches / totalSearches) * 100 : 0);
    const repeatSearches24h = funnel?.repeatSearches24h ?? summary?.repeatSearches24h ?? 0;
    const repeatSearchRate =
      funnel?.repeatSearchRate ??
      summary?.repeatSearchRate ??
      (totalSearches ? (repeatSearches24h / totalSearches) * 100 : 0);

    return {
      totalSearches,
      totalImpressions,
      totalClicks,
      noClickSearches,
      noClickRate: Math.max(0, Number(noClickRate.toFixed(2))),
      repeatSearches24h,
      repeatSearchRate: Math.max(0, Number(repeatSearchRate.toFixed(2))),
    };
  });
  readonly ctrByPosition = computed(() => (this.overview()?.ctrByPosition ?? []).slice(0, 8));
  readonly retentionCard = computed(() => this.overview()?.retention ?? null);

  ngOnInit() {
    this.reloadAll();
  }

  reloadAll() {
    this.loadOverview();
    this.loadUsers();
    this.loadReports();
  }

  loadOverview() {
    this.loadingOverview.set(true);
    this.error.set(null);
    this.admin
      .fetchOverview({ ...this.rangeParams(), limit: 12, days: 30 })
      .pipe(finalize(() => this.loadingOverview.set(false)))
      .subscribe({
        next: (data) => this.overview.set(data),
        error: () => this.error.set('Failed to load analytics'),
      });
  }

  loadUsers() {
    this.loadingUsers.set(true);
    this.error.set(null);
    this.admin
      .fetchUsers({ q: this.userQuery.trim(), limit: 100, offset: 0 })
      .pipe(finalize(() => this.loadingUsers.set(false)))
      .subscribe({
        next: (res) => this.users.set(res.items || []),
        error: () => this.error.set('Failed to load users'),
      });
  }

  loadReports() {
    this.loadingReports.set(true);
    this.admin
      .fetchReports({ limit: 30, offset: 0 })
      .pipe(finalize(() => this.loadingReports.set(false)))
      .subscribe({
        next: (res) => this.reports.set(res.items || []),
        error: () => this.error.set('Failed to load reports'),
      });
  }

  onFilterApply() {
    this.loadOverview();
  }

  onUserSearch() {
    this.loadUsers();
  }

  deleteUser(user: AdminUserItem) {
    if (this.deletingUserId()) return;
    if (!window.confirm(`Delete user "${user.username}"?`)) return;

    this.deletingUserId.set(user.id);
    this.error.set(null);
    this.admin
      .deleteUser(user.id)
      .pipe(finalize(() => this.deletingUserId.set(null)))
      .subscribe({
        next: () => {
          this.users.set(this.users().filter((item) => item.id !== user.id));
          this.loadOverview();
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to delete user');
        },
      });
  }

  toggleUserRole(user: AdminUserItem) {
    if (this.roleUpdatingUserId()) return;
    const nextRole: 'user' | 'admin' = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Set role "${nextRole}" for ${user.username}?`)) return;

    this.roleUpdatingUserId.set(user.id);
    this.error.set(null);
    this.admin
      .updateUserRole(user.id, nextRole)
      .pipe(finalize(() => this.roleUpdatingUserId.set(null)))
      .subscribe({
        next: () => {
          this.users.set(
            this.users().map((item) =>
              item.id === user.id
                ? {
                    ...item,
                    role: nextRole,
                  }
                : item,
            ),
          );
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to update role');
        },
      });
  }

  exportReport() {
    if (this.exporting()) return;
    this.exporting.set(true);
    this.error.set(null);

    this.admin
      .exportReport({
        type: this.reportType,
        format: this.reportFormat,
        ...this.rangeParams(),
        limit: 200,
        days: 30,
      })
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (blob) => {
          const stamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `${this.reportType}_${stamp}.${this.reportFormat}`;
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(objectUrl);
          this.loadReports();
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to export report');
        },
      });
  }

  async exportCustomReport() {
    if (this.customExporting()) return;
    if (!Object.values(this.customSections()).some(Boolean)) {
      this.error.set('Select at least one section for the custom report.');
      return;
    }

    this.customExporting.set(true);
    this.error.set(null);
    try {
      if (!this.overview()) {
        throw new Error('Analytics data is not loaded yet');
      }

      const payload = this.buildCustomReportPayload();
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileBase = `${this.sanitizeFileName(this.customReportTitle || 'greenfind_analytics')}_${stamp}`;
      if (this.customReportFormat === 'json') {
        this.downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }), `${fileBase}.json`);
        return;
      }

      if (this.customReportFormat === 'csv') {
        this.downloadBlob(new Blob([this.buildCsvReport(payload)], { type: 'text/csv;charset=utf-8' }), `${fileBase}.csv`);
        return;
      }

      if (this.customReportFormat === 'txt') {
        this.downloadBlob(new Blob([this.buildTxtReport(payload)], { type: 'text/plain;charset=utf-8' }), `${fileBase}.txt`);
        return;
      }

      if (this.customReportFormat === 'html') {
        this.downloadBlob(new Blob([this.buildHtmlReport(payload)], { type: 'text/html;charset=utf-8' }), `${fileBase}.html`);
        return;
      }

      if (this.customReportFormat === 'word') {
        this.downloadBlob(new Blob([this.buildHtmlReport(payload)], { type: 'application/msword;charset=utf-8' }), `${fileBase}.doc`);
        return;
      }

      const pdfBlob = await this.buildPdfReportBlob(payload);
      this.openPdfInBrowser(pdfBlob, `${fileBase}.pdf`);
    } catch (err) {
      console.error(err);
      this.error.set('Failed to generate custom report');
    } finally {
      this.customExporting.set(false);
    }
  }

  goToResults() {
    this.router.navigateByUrl('/results');
  }

  isDeleting(userId: number): boolean {
    return this.deletingUserId() === userId;
  }

  isRoleUpdating(userId: number): boolean {
    return this.roleUpdatingUserId() === userId;
  }

  trackByUser(_index: number, item: AdminUserItem): number {
    return item.id;
  }

  trackByReport(_index: number, item: AdminReportItem): number {
    return item.id;
  }

  trackByLabel(_index: number, item: { label: string; value: number }): string {
    return item.label;
  }

  trackByBarLabel(_index: number, item: RankBarItem): string {
    return item.label;
  }

  trackByUsageCard(_index: number, item: UsageStatCard): string {
    return item.label;
  }

  trackByModeBreakdown(_index: number, item: SearchModeBreakdownItem): string {
    return item.mode;
  }

  trackByCustomSection(_index: number, item: CustomReportSectionOption): string {
    return item.key;
  }

  trackByTrendPoint(_index: number, item: DailyTrendPoint): string {
    return item.day;
  }

  trackByTrendTick(_index: number, item: DailyTrendTick): number {
    return item.y;
  }

  trackByCtrPosition(_index: number, item: { position: number }): number {
    return item.position;
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  formatMetricValue(value: number | null): string {
    if (value === null) return '-';
    return this.formatNumber(value);
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return `${value.toFixed(2)}%`;
  }

  isCustomSectionEnabled(key: CustomReportSectionKey): boolean {
    return this.customSections()[key];
  }

  onCustomSectionToggle(key: CustomReportSectionKey, event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    this.customSections.update((state) => ({
      ...state,
      [key]: checked,
    }));
  }

  private rangeParams(): { from?: string; to?: string } {
    const from = this.fromDate.trim();
    const to = this.toDate.trim();

    return {
      from: from || undefined,
      to: to || undefined,
    };
  }

  private buildCustomReportPayload(): CustomReportPayload {
    const overview = this.overview();
    const sections = this.customSections();
    const topLimit = this.normalizeTopLimit(this.customTopLimit);
    const generatedAt = new Date().toISOString();
    const period = {
      from: this.fromDate.trim() || null,
      to: this.toDate.trim() || null,
    };

    const summary = sections.summary ? overview?.summary ?? null : null;
    const engagement = sections.engagement ? this.engagementCard() : null;
    const modeBreakdown = sections.modeBreakdown
      ? this.modeBreakdown().map((item) => ({
          mode: item.mode,
          label: item.label,
          count: item.count,
          users: item.users,
          share: item.share,
        }))
      : null;
    const dailyTrend = sections.dailyTrend
      ? {
          total: this.dailyTrendChart().total,
          avg: this.dailyTrendChart().avg,
          peakLabel: this.dailyTrendChart().peak?.label ?? null,
          points: (overview?.dailyTrend ?? [])
            .slice(-Math.max(7, topLimit))
            .map((item) => ({ day: item.day, label: this.formatTrendLabel(item.day), count: item.count })),
        }
      : null;
    const topQueries = sections.topQueries
      ? this.topQueryBars()
          .slice(0, topLimit)
          .map((item) => ({ label: item.label, count: item.value, rank: item.rank, share: item.width }))
      : null;
    const topSites = sections.topSites
      ? this.topSiteBars()
          .slice(0, topLimit)
          .map((item) => ({ label: item.label, count: item.value, rank: item.rank, share: item.width }))
      : null;
    const users = sections.users
      ? [...this.users()]
          .sort((a, b) => b.searchesCount - a.searchesCount)
          .slice(0, topLimit)
          .map((user) => ({
            username: user.username,
            email: user.email,
            role: user.role,
            searchesCount: user.searchesCount,
            clicksCount: user.clicksCount,
          }))
      : null;
    const recentExports = sections.recentExports
      ? this.reports()
          .slice(0, topLimit)
          .map((item) => ({
            reportType: item.reportType,
            outputFormat: item.outputFormat,
            status: item.status,
            fileName: item.fileName,
            createdAt: item.createdAt,
          }))
      : null;

    return {
      title: (this.customReportTitle || 'GreenFind analytics report').trim(),
      generatedAt,
      period,
      includeCharts: this.customIncludeCharts,
      summary,
      engagement,
      modeBreakdown,
      dailyTrend,
      topQueries,
      topSites,
      users,
      recentExports,
    };
  }

  private buildCsvReport(report: CustomReportPayload): string {
    const rows: Array<Array<string | number | null>> = [];
    const push = (...cells: Array<string | number | null>) => rows.push(cells);
    const addSpacer = () => rows.push([]);

    push('Report title', report.title);
    push('Generated at', this.formatDateTime(report.generatedAt));
    push('Period from', report.period.from || 'all time');
    push('Period to', report.period.to || 'all time');

    if (report.summary) {
      addSpacer();
      push('Summary', null);
      push('Metric', 'Value');
      push('Total searches', report.summary.totalSearches);
      push('Unique search users', report.summary.uniqueSearchUsers);
      push('Total site clicks', report.summary.totalClicks);
      push('Unique click users', report.summary.uniqueClickUsers);
    }

    if (report.engagement) {
      addSpacer();
      push('Engagement', null);
      push('Metric', 'Value');
      push('Click-through rate (%)', report.engagement.clickRate);
      push('Active click users / search users (%)', report.engagement.activeUserRate);
    }

    if (report.modeBreakdown?.length) {
      addSpacer();
      push('Mode breakdown', null);
      push('Mode', 'Searches', 'Share (%)', 'Users');
      report.modeBreakdown.forEach((item) => {
        push(item.label, item.count, item.share, item.users ?? '');
      });
    }

    if (report.dailyTrend?.points.length) {
      addSpacer();
      push('Daily trend', null);
      push('Day', 'Searches');
      report.dailyTrend.points.forEach((point) => push(point.day, point.count));
    }

    if (report.topQueries?.length) {
      addSpacer();
      push('Top queries', null);
      push('Rank', 'Query', 'Count', 'Share (%)');
      report.topQueries.forEach((item) => push(item.rank, item.label, item.count, item.share));
    }

    if (report.topSites?.length) {
      addSpacer();
      push('Top sites', null);
      push('Rank', 'Domain', 'Count', 'Share (%)');
      report.topSites.forEach((item) => push(item.rank, item.label, item.count, item.share));
    }

    if (report.users?.length) {
      addSpacer();
      push('User activity', null);
      push('Username', 'Email', 'Role', 'Searches', 'Clicks');
      report.users.forEach((user) => push(user.username, user.email, user.role, user.searchesCount, user.clicksCount));
    }

    if (report.recentExports?.length) {
      addSpacer();
      push('Recent exports', null);
      push('Type', 'Format', 'Status', 'File', 'Created at');
      report.recentExports.forEach((item) =>
        push(item.reportType, item.outputFormat, item.status, item.fileName || '-', this.formatDateTime(item.createdAt)),
      );
    }

    return rows.map((row) => row.map((cell) => this.escapeCsv(cell)).join(',')).join('\n');
  }

  private buildTxtReport(report: CustomReportPayload): string {
    const lines: string[] = [];
    lines.push(report.title);
    lines.push(`Generated at: ${this.formatDateTime(report.generatedAt)}`);
    lines.push(`Period: ${report.period.from || 'all time'} -> ${report.period.to || 'all time'}`);
    lines.push('');

    const sectionHeader = (title: string) => {
      lines.push(title.toUpperCase());
      lines.push('-'.repeat(title.length));
    };

    if (report.summary) {
      sectionHeader('Summary');
      lines.push(`Total searches: ${this.formatNumber(report.summary.totalSearches)}`);
      lines.push(`Unique search users: ${this.formatNumber(report.summary.uniqueSearchUsers)}`);
      lines.push(`Total site clicks: ${this.formatNumber(report.summary.totalClicks)}`);
      lines.push(`Unique click users: ${this.formatNumber(report.summary.uniqueClickUsers)}`);
      lines.push('');
    }

    if (report.engagement) {
      sectionHeader('Engagement');
      lines.push(`CTR: ${report.engagement.clickRate.toFixed(1)}%`);
      lines.push(`Active click users ratio: ${report.engagement.activeUserRate.toFixed(1)}%`);
      lines.push('');
    }

    if (report.modeBreakdown?.length) {
      sectionHeader('Mode breakdown');
      report.modeBreakdown.forEach((item) =>
        lines.push(`${item.label}: ${this.formatNumber(item.count)} (${item.share.toFixed(1)}%)${item.users !== null ? `, users: ${this.formatNumber(item.users)}` : ''}`),
      );
      lines.push('');
    }

    if (report.dailyTrend?.points.length) {
      sectionHeader('Daily trend');
      report.dailyTrend.points.forEach((point) => lines.push(`${point.day}: ${this.formatNumber(point.count)}`));
      lines.push('');
    }

    if (report.topQueries?.length) {
      sectionHeader('Top queries');
      report.topQueries.forEach((item) => lines.push(`#${item.rank} ${item.label} -> ${this.formatNumber(item.count)}`));
      lines.push('');
    }

    if (report.topSites?.length) {
      sectionHeader('Top sites');
      report.topSites.forEach((item) => lines.push(`#${item.rank} ${item.label} -> ${this.formatNumber(item.count)}`));
      lines.push('');
    }

    if (report.users?.length) {
      sectionHeader('User activity');
      report.users.forEach((user) =>
        lines.push(`${user.username} (${user.role}) | searches: ${this.formatNumber(user.searchesCount)}, clicks: ${this.formatNumber(user.clicksCount)}`),
      );
      lines.push('');
    }

    if (report.recentExports?.length) {
      sectionHeader('Recent exports');
      report.recentExports.forEach((item) =>
        lines.push(`${item.reportType} / ${item.outputFormat} / ${item.status} / ${this.formatDateTime(item.createdAt)}`),
      );
      lines.push('');
    }

    return lines.join('\n');
  }

  private buildHtmlReport(report: CustomReportPayload): string {
    const esc = (value: unknown) => this.escapeHtml(value);
    const html: string[] = [];
    html.push('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>GreenFind Report</title>');
    html.push(
      '<style>body{font-family:Segoe UI,Arial,sans-serif;margin:28px;color:#0f172a;background:#f6fbf6}h1{margin:0 0 8px}h2{margin:24px 0 12px;color:#276e21}p.meta{margin:2px 0;color:#4b5563}table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden}th,td{padding:8px 10px;border:1px solid #e5e7eb;text-align:left;font-size:13px}th{background:#edf9ec;color:#14532d}section{margin-top:20px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px}svg{width:100%;height:auto;border:1px solid #e5e7eb;border-radius:12px;background:#fff}small.note{color:#6b7280}</style>',
    );
    html.push('</head><body>');
    html.push(`<h1>${esc(report.title)}</h1>`);
    html.push(`<p class="meta">Generated at: ${esc(this.formatDateTime(report.generatedAt))}</p>`);
    html.push(`<p class="meta">Period: ${esc(report.period.from || 'all time')} -> ${esc(report.period.to || 'all time')}</p>`);

    if (report.summary) {
      html.push('<section><h2>Summary</h2><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>');
      html.push(`<tr><td>Total searches</td><td>${esc(this.formatNumber(report.summary.totalSearches))}</td></tr>`);
      html.push(`<tr><td>Unique search users</td><td>${esc(this.formatNumber(report.summary.uniqueSearchUsers))}</td></tr>`);
      html.push(`<tr><td>Total site clicks</td><td>${esc(this.formatNumber(report.summary.totalClicks))}</td></tr>`);
      html.push(`<tr><td>Unique click users</td><td>${esc(this.formatNumber(report.summary.uniqueClickUsers))}</td></tr>`);
      html.push('</tbody></table></section>');
    }

    if (report.engagement) {
      html.push('<section><h2>Engagement</h2><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>');
      html.push(`<tr><td>CTR</td><td>${esc(report.engagement.clickRate.toFixed(1))}%</td></tr>`);
      html.push(`<tr><td>Active click users ratio</td><td>${esc(report.engagement.activeUserRate.toFixed(1))}%</td></tr>`);
      html.push('</tbody></table></section>');
    }

    if (report.modeBreakdown?.length) {
      html.push('<section><h2>Mode breakdown</h2><table><thead><tr><th>Mode</th><th>Searches</th><th>Share</th><th>Users</th></tr></thead><tbody>');
      report.modeBreakdown.forEach((item) => {
        html.push(`<tr><td>${esc(item.label)}</td><td>${esc(this.formatNumber(item.count))}</td><td>${esc(item.share.toFixed(1))}%</td><td>${esc(item.users !== null ? this.formatNumber(item.users) : '-')}</td></tr>`);
      });
      html.push('</tbody></table>');
      if (report.includeCharts) {
        html.push(`<div style="margin-top:12px">${this.buildBarChartSvgMarkup(report.modeBreakdown.map((item) => ({ label: item.label, count: item.count })), '#57c84d', '#9be15d')}</div>`);
      }
      html.push('</section>');
    }

    if (report.dailyTrend?.points.length) {
      html.push('<section><h2>Daily trend</h2>');
      html.push(`<p class="meta">Total: ${esc(this.formatNumber(report.dailyTrend.total))} | Avg/day: ${esc(this.formatNumber(report.dailyTrend.avg))} | Peak: ${esc(report.dailyTrend.peakLabel || '-')}</p>`);
      if (report.includeCharts) {
        html.push(`<div style="margin:10px 0 14px">${this.buildLineChartSvgMarkup(report.dailyTrend.points)}</div>`);
      }
      html.push('<table><thead><tr><th>Day</th><th>Searches</th></tr></thead><tbody>');
      report.dailyTrend.points.forEach((item) => html.push(`<tr><td>${esc(item.day)}</td><td>${esc(this.formatNumber(item.count))}</td></tr>`));
      html.push('</tbody></table></section>');
    }

    if (report.topQueries?.length) {
      html.push('<section><h2>Top queries</h2>');
      if (report.includeCharts) {
        html.push(`<div style="margin:8px 0 14px">${this.buildBarChartSvgMarkup(report.topQueries.map((item) => ({ label: item.label, count: item.count })), '#57c84d', '#d9f99d')}</div>`);
      }
      html.push('<table><thead><tr><th>Rank</th><th>Query</th><th>Count</th></tr></thead><tbody>');
      report.topQueries.forEach((item) => html.push(`<tr><td>${item.rank}</td><td>${esc(item.label)}</td><td>${esc(this.formatNumber(item.count))}</td></tr>`));
      html.push('</tbody></table></section>');
    }

    if (report.topSites?.length) {
      html.push('<section><h2>Top sites</h2>');
      if (report.includeCharts) {
        html.push(`<div style="margin:8px 0 14px">${this.buildBarChartSvgMarkup(report.topSites.map((item) => ({ label: item.label, count: item.count })), '#22c55e', '#67e8f9')}</div>`);
      }
      html.push('<table><thead><tr><th>Rank</th><th>Domain</th><th>Count</th></tr></thead><tbody>');
      report.topSites.forEach((item) => html.push(`<tr><td>${item.rank}</td><td>${esc(item.label)}</td><td>${esc(this.formatNumber(item.count))}</td></tr>`));
      html.push('</tbody></table></section>');
    }

    if (report.users?.length) {
      html.push('<section><h2>User activity</h2><table><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Searches</th><th>Clicks</th></tr></thead><tbody>');
      report.users.forEach((user) =>
        html.push(`<tr><td>${esc(user.username)}</td><td>${esc(user.email)}</td><td>${esc(user.role)}</td><td>${esc(this.formatNumber(user.searchesCount))}</td><td>${esc(this.formatNumber(user.clicksCount))}</td></tr>`),
      );
      html.push('</tbody></table></section>');
    }

    if (report.recentExports?.length) {
      html.push('<section><h2>Recent exports</h2><table><thead><tr><th>Type</th><th>Format</th><th>Status</th><th>File</th><th>Created</th></tr></thead><tbody>');
      report.recentExports.forEach((item) =>
        html.push(`<tr><td>${esc(item.reportType)}</td><td>${esc(item.outputFormat)}</td><td>${esc(item.status)}</td><td>${esc(item.fileName || '-')}</td><td>${esc(this.formatDateTime(item.createdAt))}</td></tr>`),
      );
      html.push('</tbody></table></section>');
    }

    html.push('<p><small class="note">Generated by GreenFind Admin Dashboard custom report builder.</small></p>');
    html.push('</body></html>');
    return html.join('');
  }

  private async buildPdfReportBlob(report: CustomReportPayload): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 38;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (space: number) => {
      if (y + space <= pageHeight - margin) return;
      doc.addPage();
      y = margin;
    };

    const addSectionHeading = (title: string) => {
      ensureSpace(34);
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(margin, y, contentWidth, 24, 6, 6, 'F');
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(margin, y, contentWidth, 24, 6, 6, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(22, 101, 52);
      doc.text(title, margin + 10, y + 16);
      y += 32;
    };

    const addMetricTable = (rows: Array<[string, string]>) => {
      ensureSpace(28 + rows.length * 20);
      const tableHeight = this.drawPdfTable(
        doc,
        margin,
        y,
        contentWidth,
        ['Metric', 'Value'],
        rows,
        [0.56, 0.44],
      );
      y += tableHeight + 10;
    };

    ensureSpace(88);
    doc.setFillColor(20, 83, 45);
    doc.roundedRect(margin, y, contentWidth, 76, 12, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(240, 253, 244);
    doc.text(this.truncateText(report.title, 78), margin + 16, y + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(220, 252, 231);
    doc.text(`Generated: ${this.formatDateTime(report.generatedAt)}`, margin + 16, y + 47);
    doc.text(`Period: ${report.period.from || 'all time'} -> ${report.period.to || 'all time'}`, margin + 16, y + 63);
    y += 88;

    if (report.summary) {
      addSectionHeading('Summary KPI');
      addMetricTable([
        ['Total searches', this.formatNumber(report.summary.totalSearches)],
        ['Unique search users', this.formatNumber(report.summary.uniqueSearchUsers)],
        ['Total site clicks', this.formatNumber(report.summary.totalClicks)],
        ['Unique click users', this.formatNumber(report.summary.uniqueClickUsers)],
      ]);
    }

    if (report.engagement) {
      addSectionHeading('Engagement');
      addMetricTable([
        ['CTR', `${report.engagement.clickRate.toFixed(1)}%`],
        ['Active click users ratio', `${report.engagement.activeUserRate.toFixed(1)}%`],
        ['Total searches', this.formatNumber(report.engagement.totalSearches)],
        ['Total clicks', this.formatNumber(report.engagement.totalClicks)],
      ]);
    }

    if (report.modeBreakdown?.length) {
      addSectionHeading('Mode breakdown');
      if (report.includeCharts) {
        const chartHeight = Math.min(40 + report.modeBreakdown.length * 26, 230);
        ensureSpace(chartHeight + 14);
        this.drawPdfBarChart(
          doc,
          report.modeBreakdown.map((item) => ({ label: item.label, count: item.count })),
          margin,
          y,
          contentWidth,
          chartHeight,
        );
        y += chartHeight + 10;
      }
      const modeRows = report.modeBreakdown.map((item) => [
        item.label,
        this.formatNumber(item.count),
        `${item.share.toFixed(1)}%`,
        item.users !== null ? this.formatNumber(item.users) : '-',
      ]);
      ensureSpace(40 + modeRows.length * 18);
      y += this.drawPdfTable(doc, margin, y, contentWidth, ['Mode', 'Searches', 'Share', 'Users'], modeRows, [0.34, 0.24, 0.18, 0.24]) + 8;
    }

    if (report.dailyTrend?.points.length) {
      addSectionHeading('Daily trend');
      const trendRows: Array<[string, string]> = [
        ['Total searches in period', this.formatNumber(report.dailyTrend.total)],
        ['Average per day', this.formatNumber(report.dailyTrend.avg)],
      ];
      if (report.dailyTrend.peakLabel) trendRows.push(['Peak day', report.dailyTrend.peakLabel]);
      addMetricTable(trendRows);

      if (report.includeCharts) {
        const chartHeight = 180;
        ensureSpace(chartHeight + 12);
        this.drawPdfLineChart(doc, report.dailyTrend.points, margin, y, contentWidth, chartHeight);
        y += chartHeight + 12;
      }
    }

    if (report.topQueries?.length) {
      addSectionHeading('Top queries');
      if (report.includeCharts) {
        const chartHeight = Math.min(40 + report.topQueries.length * 24, 230);
        ensureSpace(chartHeight + 12);
        this.drawPdfBarChart(
          doc,
          report.topQueries.map((item) => ({ label: item.label, count: item.count })),
          margin,
          y,
          contentWidth,
          chartHeight,
        );
        y += chartHeight + 10;
      }
      const queryRows = report.topQueries.map((item) => [String(item.rank), item.label, this.formatNumber(item.count), `${item.share.toFixed(1)}%`]);
      ensureSpace(40 + queryRows.length * 18);
      y += this.drawPdfTable(doc, margin, y, contentWidth, ['Rank', 'Query', 'Count', 'Share'], queryRows, [0.12, 0.58, 0.16, 0.14]) + 8;
    }

    if (report.topSites?.length) {
      addSectionHeading('Top sites');
      if (report.includeCharts) {
        const chartHeight = Math.min(40 + report.topSites.length * 24, 230);
        ensureSpace(chartHeight + 12);
        this.drawPdfBarChart(
          doc,
          report.topSites.map((item) => ({ label: item.label, count: item.count })),
          margin,
          y,
          contentWidth,
          chartHeight,
        );
        y += chartHeight + 10;
      }
      const siteRows = report.topSites.map((item) => [String(item.rank), item.label, this.formatNumber(item.count), `${item.share.toFixed(1)}%`]);
      ensureSpace(40 + siteRows.length * 18);
      y += this.drawPdfTable(doc, margin, y, contentWidth, ['Rank', 'Domain', 'Count', 'Share'], siteRows, [0.12, 0.58, 0.16, 0.14]) + 8;
    }

    if (report.users?.length) {
      addSectionHeading('User activity');
      const userRows = report.users.map((user) => [
        user.username,
        user.email,
        user.role,
        this.formatNumber(user.searchesCount),
        this.formatNumber(user.clicksCount),
      ]);
      ensureSpace(40 + userRows.length * 18);
      y += this.drawPdfTable(doc, margin, y, contentWidth, ['User', 'Email', 'Role', 'Searches', 'Clicks'], userRows, [0.18, 0.34, 0.14, 0.17, 0.17]) + 8;
    }

    if (report.recentExports?.length) {
      addSectionHeading('Recent exports');
      const exportRows = report.recentExports.map((item) => [
        item.reportType,
        item.outputFormat,
        item.status,
        item.fileName || '-',
        this.formatDateTime(item.createdAt),
      ]);
      ensureSpace(40 + exportRows.length * 18);
      y += this.drawPdfTable(doc, margin, y, contentWidth, ['Type', 'Format', 'Status', 'File', 'Created at'], exportRows, [0.2, 0.12, 0.14, 0.24, 0.3]) + 8;
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Generated by GreenFind custom report builder', margin, pageHeight - 18);

    return doc.output('blob');
  }

  private drawPdfLineChart(
    doc: any,
    points: Array<{ count: number; label?: string }>,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, width, height, 8, 8, 'FD');

    const padding = { top: 16, right: 20, bottom: 22, left: 26 };
    const chartX = x + padding.left;
    const chartY = y + padding.top;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const counts = points.map((item) => item.count);
    const max = Math.max(...counts, 1);
    const stepX = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth;
    const toY = (value: number) => chartY + chartHeight - (value / max) * chartHeight;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.8);
    for (let i = 0; i <= 4; i++) {
      const guideY = chartY + (chartHeight / 4) * i;
      doc.line(chartX, guideY, chartX + chartWidth, guideY);
    }

    doc.setDrawColor(39, 174, 96);
    doc.setLineWidth(2.2);
    for (let i = 1; i < points.length; i++) {
      const prevX = chartX + (i - 1) * stepX;
      const prevY = toY(points[i - 1].count);
      const nextX = chartX + i * stepX;
      const nextY = toY(points[i].count);
      doc.line(prevX, prevY, nextX, nextY);
    }

    doc.setFillColor(87, 200, 77);
    points.forEach((point, index) => {
      const cx = chartX + index * stepX;
      const cy = toY(point.count);
      doc.circle(cx, cy, 2.4, 'F');
    });

    const labelCandidates = [points[0], points[Math.floor((points.length - 1) / 2)], points[points.length - 1]].filter(
      (item, index, list) => !!item?.label && list.findIndex((other) => other?.label === item?.label) === index,
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    labelCandidates.forEach((item, index) => {
      const lx = index === 0 ? chartX : index === labelCandidates.length - 1 ? chartX + chartWidth - 45 : chartX + chartWidth / 2 - 20;
      doc.text(this.truncateText(item?.label || '', 10), lx, y + height - 8);
    });
  }

  private drawPdfBarChart(
    doc: any,
    items: Array<{ label: string; count: number }>,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    if (!items.length) return;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, width, height, 8, 8, 'FD');

    const chartLeft = x + 10;
    const chartTop = y + 10;
    const labelWidth = Math.min(220, width * 0.38);
    const barAreaStart = chartLeft + labelWidth;
    const valueAreaWidth = 56;
    const availableWidth = width - labelWidth - valueAreaWidth - 24;
    const rowHeight = Math.max(18, Math.min(24, (height - 20) / items.length));
    const barHeight = Math.max(8, rowHeight - 8);
    const maxCount = Math.max(...items.map((item) => item.count), 1);

    items.forEach((item, index) => {
      const lineY = chartTop + index * rowHeight;
      const barWidth = (item.count / maxCount) * availableWidth;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text(this.truncateText(item.label, 34), chartLeft, lineY + 12);

      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barAreaStart, lineY + 2, availableWidth, barHeight, 4, 4, 'F');
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(barAreaStart, lineY + 2, barWidth, barHeight, 4, 4, 'F');

      doc.setTextColor(15, 23, 42);
      doc.text(this.formatNumber(item.count), barAreaStart + availableWidth + 8, lineY + 12);
    });
  }

  private drawPdfTable(
    doc: any,
    x: number,
    y: number,
    width: number,
    headers: string[],
    rows: string[][],
    fractions?: number[],
  ): number {
    const colFractions = fractions && fractions.length === headers.length
      ? fractions
      : Array.from({ length: headers.length }, () => 1 / headers.length);
    const normalizedTotal = colFractions.reduce((sum, value) => sum + value, 0) || 1;
    const colWidths = colFractions.map((fraction) => (width * fraction) / normalizedTotal);
    const rowHeight = 20;
    let currentY = y;

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.rect(x, currentY, width, rowHeight, 'FD');

    let cellX = x;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(22, 101, 52);
    headers.forEach((header, index) => {
      doc.text(this.truncateText(header, 24), cellX + 6, currentY + 13);
      if (index < headers.length - 1) {
        doc.setDrawColor(187, 247, 208);
        doc.line(cellX + colWidths[index], currentY, cellX + colWidths[index], currentY + rowHeight);
      }
      cellX += colWidths[index];
    });
    currentY += rowHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    rows.forEach((row, rowIndex) => {
      const bg = rowIndex % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.setDrawColor(226, 232, 240);
      doc.rect(x, currentY, width, rowHeight, 'FD');

      let rowX = x;
      row.forEach((cell, colIndex) => {
        const maxLen = Math.max(8, Math.floor((colWidths[colIndex] - 12) / 5));
        doc.setTextColor(15, 23, 42);
        doc.text(this.truncateText(String(cell ?? ''), maxLen), rowX + 6, currentY + 13);
        if (colIndex < row.length - 1) {
          doc.setDrawColor(226, 232, 240);
          doc.line(rowX + colWidths[colIndex], currentY, rowX + colWidths[colIndex], currentY + rowHeight);
        }
        rowX += colWidths[colIndex];
      });

      currentY += rowHeight;
    });

    return currentY - y;
  }

  private buildLineChartSvgMarkup(points: Array<{ label: string; count: number }>): string {
    const width = 760;
    const height = 230;
    const padding = 26;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;
    const max = Math.max(...points.map((item) => item.count), 1);
    const stepX = points.length > 1 ? drawWidth / (points.length - 1) : 0;

    const chartPoints = points.map((item, index) => {
      const x = padding + index * stepX;
      const y = height - padding - (item.count / max) * drawHeight;
      return { x, y };
    });

    const path = chartPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ');

    const circles = chartPoints
      .map((point) => `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="3" fill="#57c84d" />`)
      .join('');

    const labels = [
      points[0]?.label,
      points[Math.floor((points.length - 1) / 2)]?.label,
      points[points.length - 1]?.label,
    ]
      .filter((label, index, arr): label is string => !!label && arr.indexOf(label) === index)
      .join(' • ');

    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Daily trend chart"><rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/><path d="${path}" fill="none" stroke="#57c84d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${circles}<text x="${padding}" y="${height - 6}" fill="#6b7280" font-size="11">${this.escapeHtml(labels || '')}</text></svg>`;
  }

  private buildBarChartSvgMarkup(items: Array<{ label: string; count: number }>, fromColor: string, toColor: string): string {
    if (!items.length) return '';
    const width = 760;
    const rowHeight = 28;
    const height = items.length * rowHeight + 20;
    const max = Math.max(...items.map((item) => item.count), 1);

    const bars = items
      .map((item, index) => {
        const y = 10 + index * rowHeight;
        const barWidth = ((item.count / max) * 420).toFixed(2);
        return `<text x="10" y="${y + 15}" fill="#334155" font-size="12">${this.escapeHtml(this.truncateText(item.label, 48))}</text><rect x="300" y="${y + 4}" width="${barWidth}" height="12" rx="6" fill="url(#barGrad)"/><text x="${310 + Number(barWidth)}" y="${y + 15}" fill="#0f172a" font-size="11">${this.escapeHtml(this.formatNumber(item.count))}</text>`;
      })
      .join('');

    return `<svg viewBox="0 0 ${width} ${height}" role="img"><defs><linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${fromColor}"/><stop offset="100%" stop-color="${toColor}"/></linearGradient></defs><rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>${bars}</svg>`;
  }

  private formatDateTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString();
  }

  private normalizeTopLimit(value: number): number {
    if (!Number.isFinite(value)) return 10;
    return Math.max(3, Math.min(50, Math.round(value)));
  }

  private sanitizeFileName(value: string): string {
    return value
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
      .replace(/\s+/g, '_')
      .replace(/-+/g, '-')
      .replace(/^[-_.]+|[-_.]+$/g, '')
      .slice(0, 80) || 'greenfind_report';
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  private openPdfInBrowser(blob: Blob, fileName: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const previewWindow = window.open(objectUrl, '_blank');
    if (!previewWindow) {
      this.downloadBlob(blob, fileName);
      URL.revokeObjectURL(objectUrl);
      return;
    }

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
  }

  private escapeCsv(value: unknown): string {
    const text = value === null || value === undefined ? '' : String(value);
    if (!/[",\n]/.test(text)) return text;
    return `"${text.replace(/"/g, '""')}"`;
  }

  private escapeHtml(value: unknown): string {
    const text = value === null || value === undefined ? '' : String(value);
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private truncateText(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 3)}...`;
  }

  private createDailyTrendChart(items: AdminOverviewResponse['dailyTrend']): DailyTrendChartModel {
    const width = 660;
    const height = 248;
    const paddingX = 28;
    const paddingY = 20;
    const baselineY = height - paddingY;
    if (!items.length) {
      return {
        width,
        height,
        baselineY,
        points: [],
        linePath: '',
        areaPath: '',
        ticks: this.generateTicks(0, 0, height, paddingY),
        axisLabels: [],
        total: 0,
        avg: 0,
        peak: null,
      };
    }

    const counts = items.map((item) => item.count);
    const min = Math.min(...counts, 0);
    const max = Math.max(...counts, 1);
    const range = Math.max(max - min, 1);
    const drawWidth = width - paddingX * 2;
    const drawHeight = height - paddingY * 2;
    const step = items.length > 1 ? drawWidth / (items.length - 1) : 0;
    const points: DailyTrendPoint[] = items.map((item, index) => {
      const x = paddingX + step * index;
      const normalized = (item.count - min) / range;
      const y = height - paddingY - normalized * drawHeight;
      return {
        x,
        y,
        value: item.count,
        day: item.day,
        label: this.formatTrendLabel(item.day),
      };
    });

    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ');
    const areaPath = `M ${points[0].x.toFixed(2)} ${baselineY.toFixed(2)} ${points
      .map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ')} L ${points[points.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
    const total = counts.reduce((sum, value) => sum + value, 0);
    const avg = Math.round(total / counts.length);
    const peak = points.reduce((currentMax, point) => (point.value > currentMax.value ? point : currentMax), points[0]);

    return {
      width,
      height,
      baselineY,
      points,
      linePath,
      areaPath,
      ticks: this.generateTicks(min, max, height, paddingY),
      axisLabels: this.createAxisLabels(points),
      total,
      avg,
      peak,
    };
  }

  private toRankBars(items: AdminTopItem[], valueGetter: (item: AdminTopItem) => string): RankBarItem[] {
    if (!items.length) return [];
    const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, 8);
    const max = Math.max(...sorted.map((item) => item.count), 1);
    return sorted.map((item, index) => ({
      label: valueGetter(item),
      value: item.count,
      width: Math.max(6, Number(((item.count / max) * 100).toFixed(1))),
      rank: index + 1,
    }));
  }

  private generateTicks(min: number, max: number, height: number, paddingY: number): DailyTrendTick[] {
    const tickCount = 4;
    const drawHeight = height - paddingY * 2;
    return Array.from({ length: tickCount + 1 }, (_, index) => {
      const ratio = index / tickCount;
      const value = Math.round(max - (max - min) * ratio);
      const y = paddingY + drawHeight * ratio;
      return { y, value };
    });
  }

  private createAxisLabels(points: DailyTrendPoint[]): DailyTrendAxisLabel[] {
    if (points.length <= 3) {
      return points.map((point) => ({ label: point.label }));
    }

    const first = points[0];
    const middle = points[Math.floor((points.length - 1) / 2)];
    const last = points[points.length - 1];
    return [
      { label: first.label },
      { label: middle.label },
      { label: last.label },
    ];
  }

  private formatTrendLabel(dayIso: string): string {
    const date = new Date(dayIso);
    if (Number.isNaN(date.getTime())) return dayIso;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private extractModeMetrics(overview: AdminOverviewResponse | null): SearchModeMetric[] {
    if (!overview) return [];
    const raw = overview as unknown as Record<string, unknown>;

    const nestedCandidates: unknown[] = [
      raw['modeBreakdown'],
      raw['searchModes'],
      raw['searchModeBreakdown'],
      raw['modes'],
      this.getNested(raw, ['searchStats', 'byMode']),
      this.getNested(raw, ['searchStats', 'modes']),
      this.getNested(raw, ['summary', 'modeBreakdown']),
      this.getNested(raw, ['summary', 'searchModes']),
    ];

    for (const candidate of nestedCandidates) {
      const parsed = this.parseModeMetrics(candidate);
      if (parsed.length) return parsed;
    }

    return this.extractModeMetricsFromSummary(this.getNested(raw, ['summary']));
  }

  private parseModeMetrics(value: unknown): SearchModeMetric[] {
    if (Array.isArray(value)) {
      return this.mergeModeMetrics(
        value
          .map((item) => this.parseModeMetricArrayItem(item))
          .filter((item): item is SearchModeMetric => item !== null),
      );
    }

    if (this.isRecord(value)) {
      const metrics: SearchModeMetric[] = [];
      Object.entries(value).forEach(([key, rawValue]) => {
        const mode = this.normalizeModeName(key);
        if (!mode) return;

        if (this.isRecord(rawValue)) {
          const count = this.pickNumber(rawValue, ['count', 'searches', 'value', 'total', 'items']);
          if (count === null) return;
          const users = this.pickNumber(rawValue, ['users', 'uniqueUsers', 'people', 'unique']);
          metrics.push({ mode, count, users });
          return;
        }

        const count = this.toNonNegativeNumber(rawValue);
        if (count === null) return;
        metrics.push({ mode, count, users: null });
      });

      return this.mergeModeMetrics(metrics);
    }

    return [];
  }

  private parseModeMetricArrayItem(value: unknown): SearchModeMetric | null {
    if (!this.isRecord(value)) return null;

    const modeRaw = this.pickText(value, ['mode', 'type', 'name', 'key', 'searchMode']);
    const mode = this.normalizeModeName(modeRaw);
    if (!mode) return null;

    const count = this.pickNumber(value, ['count', 'searches', 'value', 'total', 'items']);
    if (count === null) return null;

    const users = this.pickNumber(value, ['users', 'uniqueUsers', 'people', 'unique']);
    return { mode, count, users };
  }

  private extractModeMetricsFromSummary(summary: unknown): SearchModeMetric[] {
    if (!this.isRecord(summary)) return [];

    const web = this.pickNumber(summary, ['webSearches', 'webCount', 'searchesWeb', 'web']);
    const images = this.pickNumber(summary, ['imageSearches', 'imagesSearches', 'searchesImages', 'images']);
    const video = this.pickNumber(summary, ['videoSearches', 'videosSearches', 'searchesVideo', 'video']);

    const metrics: SearchModeMetric[] = [];
    if (web !== null) metrics.push({ mode: 'web', count: web, users: null });
    if (images !== null) metrics.push({ mode: 'images', count: images, users: null });
    if (video !== null) metrics.push({ mode: 'video', count: video, users: null });
    return this.mergeModeMetrics(metrics);
  }

  private mergeModeMetrics(items: SearchModeMetric[]): SearchModeMetric[] {
    const merged = new Map<string, SearchModeMetric>();
    items.forEach((item) => {
      const existing = merged.get(item.mode);
      if (!existing) {
        merged.set(item.mode, { ...item });
        return;
      }

      existing.count += item.count;
      if (item.users !== null) {
        existing.users = (existing.users ?? 0) + item.users;
      }
    });

    return [...merged.values()].filter((item) => item.count >= 0);
  }

  private normalizeModeName(raw: unknown): string {
    if (typeof raw !== 'string') return '';
    const normalized = raw.trim().toLowerCase();
    if (!normalized) return '';

    if (['total', 'all', 'overall', 'summary'].includes(normalized)) return '';
    if (normalized.includes('image') || normalized.includes('photo') || normalized.includes('pic')) return 'images';
    if (normalized.includes('web') || normalized.includes('text') || normalized === 'default' || normalized.includes('simple')) return 'web';
    if (normalized.includes('video')) return 'video';
    if (normalized.includes('news')) return 'news';
    if (normalized.includes('map')) return 'maps';
    if (normalized.includes('shop')) return 'shopping';

    return normalized.replace(/\s+/g, '_');
  }

  private formatModeLabel(mode: string): string {
    if (mode === 'web') return 'Web search';
    if (mode === 'images') return 'Image search';
    if (mode === 'video') return 'Video search';
    if (mode === 'news') return 'News search';
    if (mode === 'maps') return 'Maps search';
    if (mode === 'shopping') return 'Shopping search';

    return mode
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private getModeGradientClass(mode: string): string {
    if (mode === 'images') return 'from-cyan-300 to-blue-200';
    if (mode === 'video') return 'from-orange-300 to-amber-200';
    if (mode === 'news') return 'from-violet-300 to-purple-200';
    if (mode === 'maps') return 'from-yellow-300 to-orange-200';
    if (mode === 'shopping') return 'from-pink-300 to-rose-200';
    return 'from-ui-green-light to-lime-200';
  }

  private getNested(record: Record<string, unknown>, path: string[]): unknown {
    let current: unknown = record;
    for (const key of path) {
      if (!this.isRecord(current) || !(key in current)) return null;
      current = current[key];
    }
    return current;
  }

  private pickNumber(record: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      if (!(key in record)) continue;
      const parsed = this.toNonNegativeNumber(record[key]);
      if (parsed !== null) return parsed;
    }
    return null;
  }

  private pickText(record: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      if (!(key in record)) continue;
      if (typeof record[key] === 'string') return record[key];
    }
    return '';
  }

  private toNonNegativeNumber(value: unknown): number | null {
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    if (!Number.isFinite(num) || num < 0) return null;
    return num;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
}

interface RankBarItem {
  label: string;
  value: number;
  width: number;
  rank: number;
}

interface DailyTrendPoint {
  x: number;
  y: number;
  value: number;
  day: string;
  label: string;
}

interface DailyTrendTick {
  y: number;
  value: number;
}

interface DailyTrendAxisLabel {
  label: string;
}

interface DailyTrendChartModel {
  width: number;
  height: number;
  baselineY: number;
  points: DailyTrendPoint[];
  linePath: string;
  areaPath: string;
  ticks: DailyTrendTick[];
  axisLabels: DailyTrendAxisLabel[];
  total: number;
  avg: number;
  peak: DailyTrendPoint | null;
}

interface UsageStatCard {
  label: string;
  value: number | null;
  hint: string;
}

interface SearchModeMetric {
  mode: string;
  count: number;
  users: number | null;
}

interface SearchModeBreakdownItem {
  mode: string;
  label: string;
  count: number;
  users: number | null;
  share: number;
  gradientClass: string;
}

type CustomReportFormat = 'pdf' | 'word' | 'html' | 'csv' | 'json' | 'txt';
type CustomReportSectionKey =
  | 'summary'
  | 'engagement'
  | 'modeBreakdown'
  | 'dailyTrend'
  | 'topQueries'
  | 'topSites'
  | 'users'
  | 'recentExports';

interface CustomReportSectionOption {
  key: CustomReportSectionKey;
  label: string;
  description: string;
}

interface CustomReportSections {
  summary: boolean;
  engagement: boolean;
  modeBreakdown: boolean;
  dailyTrend: boolean;
  topQueries: boolean;
  topSites: boolean;
  users: boolean;
  recentExports: boolean;
}

interface CustomReportPayload {
  title: string;
  generatedAt: string;
  period: {
    from: string | null;
    to: string | null;
  };
  includeCharts: boolean;
  summary: AdminSummary | null;
  engagement: {
    clickRate: number;
    activeUserRate: number;
    totalSearches: number;
    totalClicks: number;
    uniqueSearchUsers: number;
    uniqueClickUsers: number;
  } | null;
  modeBreakdown: Array<{
    mode: string;
    label: string;
    count: number;
    users: number | null;
    share: number;
  }> | null;
  dailyTrend: {
    total: number;
    avg: number;
    peakLabel: string | null;
    points: Array<{
      day: string;
      label: string;
      count: number;
    }>;
  } | null;
  topQueries: Array<{
    label: string;
    count: number;
    rank: number;
    share: number;
  }> | null;
  topSites: Array<{
    label: string;
    count: number;
    rank: number;
    share: number;
  }> | null;
  users: Array<{
    username: string;
    email: string;
    role: string;
    searchesCount: number;
    clicksCount: number;
  }> | null;
  recentExports: Array<{
    reportType: string;
    outputFormat: string;
    status: string;
    fileName: string | null;
    createdAt: string;
  }> | null;
}
