import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  AdminOverviewResponse,
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

  private rangeParams(): { from?: string; to?: string } {
    const from = this.fromDate.trim();
    const to = this.toDate.trim();

    return {
      from: from || undefined,
      to: to || undefined,
    };
  }
}
