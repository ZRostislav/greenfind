import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AuthStateService } from '../../../services/auth-state.service';
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
} from 'lucide-angular';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, LanguageSwitcherComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
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

  private readonly auth = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly language = inject(LanguageService);

  readonly user$ = this.authState.user$;
  returnUrl = '/';
  allowAdultContent = false;
  updatingAdultContent = false;
  adultContentError: string | null = null;
  showDeleteConfirm = false;
  deletingAccount = false;
  deleteError: string | null = null;
  private readonly translations: Record<AppLanguage, Record<string, string>> = {
    en: {
      backToSearch: 'Back to Search',
      activeUser: 'Active User',
      username: 'Username',
      emailAddress: 'Email Address',
      authProvider: 'Auth Provider',
      securityStatus: 'Security Status',
      emailVerified: 'Email Verified',
      unverified: 'Unverified',
      adultContent: '18+ Content',
      adultAllowed: 'Allowed (18+)',
      adultBlocked: 'Blocked (Safe mode)',
      adultHint:
        'When blocked, 18+ results are hidden and opening suspicious links is denied.',
      adultToggleTitle: 'Toggle 18+ content',
      adultToggleSr: 'Toggle 18+ content',
      adultLabel: 'Adult',
      safeLabel: 'Safe',
      adultOn: '18+ ON',
      adultOff: '18+ OFF',
      searchHistory: 'Search history',
      adminPanel: 'Admin panel',
      logoutAccount: 'Logout account',
      deleteAccount: 'Delete account',
      syncingProfile: 'Synchronizing Profile...',
      deleteAccountTitle: 'Delete account?',
      deleteAccountHint:
        'This action is permanent. Your saved links and search history will be deleted.',
      cancel: 'Cancel',
      deleting: 'Deleting...',
      yesDelete: 'Yes, delete',
      adultUpdateFailed: 'Failed to update 18+ setting. Please try again.',
      deleteFailed: 'Failed to delete account. Please try again.',
    },
    ru: {
      backToSearch: 'Назад к поиску',
      activeUser: 'Активный пользователь',
      username: 'Имя пользователя',
      emailAddress: 'Электронная почта',
      authProvider: 'Способ входа',
      securityStatus: 'Статус безопасности',
      emailVerified: 'Почта подтверждена',
      unverified: 'Не подтверждена',
      adultContent: 'Контент 18+',
      adultAllowed: 'Разрешено (18+)',
      adultBlocked: 'Заблокировано (Безопасный режим)',
      adultHint:
        'При блокировке результаты 18+ скрываются, а подозрительные ссылки не открываются.',
      adultToggleTitle: 'Переключить 18+ контент',
      adultToggleSr: 'Переключить 18+ контент',
      adultLabel: '18+',
      safeLabel: 'Safe',
      adultOn: '18+ ВКЛ',
      adultOff: '18+ ВЫКЛ',
      searchHistory: 'История поиска',
      adminPanel: 'Админ-панель',
      logoutAccount: 'Выйти из аккаунта',
      deleteAccount: 'Удалить аккаунт',
      syncingProfile: 'Синхронизируем профиль...',
      deleteAccountTitle: 'Удалить аккаунт?',
      deleteAccountHint:
        'Это действие необратимо. Сохранённые ссылки и история поиска будут удалены.',
      cancel: 'Отмена',
      deleting: 'Удаление...',
      yesDelete: 'Да, удалить',
      adultUpdateFailed: 'Не удалось обновить настройку 18+. Попробуйте снова.',
      deleteFailed: 'Не удалось удалить аккаунт. Попробуйте снова.',
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
    const rawReturnUrl = (this.route.snapshot.queryParamMap.get('returnUrl') || '').trim();
    this.returnUrl = rawReturnUrl.startsWith('/') ? rawReturnUrl : '/';
    this.allowAdultContent = Boolean(this.authState.user?.allowAdultContent);

    this.user$.subscribe((user) => {
      this.allowAdultContent = Boolean(user?.allowAdultContent);
    });
  }

  toggleAdultContent() {
    if (this.updatingAdultContent) return;

    this.adultContentError = null;
    const nextValue = !this.allowAdultContent;
    const prevValue = this.allowAdultContent;

    this.allowAdultContent = nextValue;
    this.updatingAdultContent = true;

    this.auth.updatePreferences({ allowAdultContent: nextValue }).subscribe({
      next: () => {
        this.updatingAdultContent = false;
      },
      error: () => {
        this.allowAdultContent = prevValue;
        this.updatingAdultContent = false;
        this.adultContentError = this.t('adultUpdateFailed');
      },
    });
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/'));
  }

  openDeleteConfirm() {
    this.deleteError = null;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm() {
    if (this.deletingAccount) return;
    this.showDeleteConfirm = false;
  }

  confirmDeleteAccount() {
    if (this.deletingAccount) return;

    this.deleteError = null;
    this.deletingAccount = true;
    this.auth.deleteAccount().subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => {
        this.deletingAccount = false;
        this.deleteError = this.t('deleteFailed');
      },
    });
  }

  goBack() {
    this.router.navigateByUrl(this.returnUrl || '/');
  }
}
