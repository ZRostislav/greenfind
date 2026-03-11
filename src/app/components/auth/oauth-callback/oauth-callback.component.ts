import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './oauth-callback.component.html',
})
export class OauthCallbackComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = true;
  error: string | null = null;

  constructor() {
    const token = this.extractAccessTokenFromHash();
    if (!token) {
      this.loading = false;
      this.error = 'Missing access token in callback URL.';
      return;
    }

    this.auth.setToken(token);
    this.auth
      .fetchMe()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.clearHash();
          this.router.navigateByUrl('/');
        },
        error: () => {
          this.error = 'OAuth login failed.';
          this.auth.clearSession();
          this.clearHash();
        },
      });
  }

  private extractAccessTokenFromHash(): string | null {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash?.replace(/^#/, '') || '';
    const params = new URLSearchParams(hash);
    const token = params.get('accessToken');
    return token && token.trim() ? token.trim() : null;
  }

  private clearHash() {
    if (typeof window === 'undefined') return;
    if (!window.location.hash) return;
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

