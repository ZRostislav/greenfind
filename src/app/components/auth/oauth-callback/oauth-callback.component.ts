import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { AppLanguage, LanguageService } from '../../../services/language.service';
import {
  LucideAngularModule,
  Search,
  Mic,
  Sliders,
  Globe,
  Link,
  Check,
  X,
  Plus,
  Minus,
  Type,
  FileText,
  Leaf,
  ArrowRight,
  LogOutIcon,
  ArrowLeftIcon,
  UserIcon,
  MailIcon,
  ShieldIcon,
  CheckCircleIcon,
  HistoryIcon,
  AlertCircleIcon,
  LanguagesIcon,
  ChevronRightIcon,
  LockIcon,
  ChromeIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  InfoIcon,
  FingerprintIcon,
  ShieldAlertIcon,
} from 'lucide-angular';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, LanguageSwitcherComponent],
  templateUrl: './oauth-callback.component.html',
})
export class OauthCallbackComponent {
  readonly SearchIcon = Search;
  readonly MicIcon = Mic;
  readonly SlidersIcon = Sliders;
  readonly GlobeIcon = Globe;
  readonly LinkIcon = Link;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly PlusIcon = Plus;
  readonly MinusIcon = Minus;
  readonly TypeIcon = Type;
  readonly FileTextIcon = FileText;
  readonly LeafIcon = Leaf;
  readonly ArrowRightIcon = ArrowRight;
  readonly LogOutIcon = LogOutIcon;
  readonly ArrowLeftIcon = ArrowLeftIcon;
  readonly UserIcon = UserIcon;
  readonly MailIcon = MailIcon;
  readonly ShieldIcon = ShieldIcon;
  readonly CheckCircleIcon = CheckCircleIcon;
  readonly HistoryIcon = HistoryIcon;
  readonly AlertCircleIcon = AlertCircleIcon;
  readonly LanguagesIcon = LanguagesIcon;
  readonly ChevronRightIcon = ChevronRightIcon;
  readonly LockIcon = LockIcon;
  readonly ChromeIcon = ChromeIcon;
  readonly RotateCcwIcon = RotateCcwIcon;
  readonly ShieldCheckIcon = ShieldCheckIcon;
  readonly InfoIcon = InfoIcon;
  readonly FingerprintIcon = FingerprintIcon;
  readonly ShieldAlertIcon = ShieldAlertIcon;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);

  loading = true;
  error: string | null = null;
  private readonly translations: Record<AppLanguage, Record<string, string>> = {
    en: {
      identitySync: 'Identity Sync',
      loadingSubtitle: 'Securely completing your login...',
      accessDenied: 'Access Denied',
      returnToLogin: 'Return to Login',
      oauthMissingToken: 'Missing access token in callback URL.',
      oauthFailed: 'OAuth login failed.',
      oauthTag: 'OAuth 2.0',
      encryptedSession: 'Encrypted Session',
    },
    ru: {
      identitySync: 'Синхронизация доступа',
      loadingSubtitle: 'Безопасно завершаем вход...',
      accessDenied: 'Доступ запрещён',
      returnToLogin: 'Вернуться ко входу',
      oauthMissingToken: 'В callback URL отсутствует access token.',
      oauthFailed: 'Ошибка OAuth-входа.',
      oauthTag: 'OAuth 2.0',
      encryptedSession: 'Шифрованная сессия',
    },
  };

  get selectedLanguage(): AppLanguage {
    return this.language.currentLanguage();
  }

  setLanguage(language: AppLanguage): void {
    this.language.setLanguage(language);
  }

  t(key: string): string {
    return this.translations[this.selectedLanguage][key] ?? this.translations.en[key] ?? key;
  }

  constructor() {
    const token = this.extractAccessTokenFromHash();
    if (!token) {
      this.loading = false;
      this.error = this.t('oauthMissingToken');
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
          this.error = this.t('oauthFailed');
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
