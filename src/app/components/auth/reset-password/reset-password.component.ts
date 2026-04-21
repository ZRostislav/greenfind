import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  HashIcon,
  KeyIcon,
} from 'lucide-angular';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    LanguageSwitcherComponent,
  ],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
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
  readonly HashIcon = HashIcon;
  readonly KeyIcon = KeyIcon;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly language = inject(LanguageService);

  loading = false;
  error: string | null = null;
  info: string | null = null;
  private readonly translations: Record<AppLanguage, Record<string, string>> = {
    en: {
      backToSignIn: 'Back to Sign In',
      newPassword: 'New Password',
      subtitle: 'Create a strong password to secure your account.',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      recoveryCode: 'Recovery Code',
      newPasswordLabel: 'New Password',
      passwordHint: 'Must be at least 8 characters.',
      updatePassword: 'Update Password',
      cancelAndReturn: 'Cancel and return to Sign In',
      passwordUpdated: 'Password updated. You can sign in now.',
      resetFailed: 'Reset failed',
    },
    ru: {
      backToSignIn: 'Назад ко входу',
      newPassword: 'Новый пароль',
      subtitle: 'Создайте надёжный пароль для защиты аккаунта.',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      recoveryCode: 'Код восстановления',
      newPasswordLabel: 'Новый пароль',
      passwordHint: 'Минимум 8 символов.',
      updatePassword: 'Обновить пароль',
      cancelAndReturn: 'Отменить и вернуться ко входу',
      passwordUpdated: 'Пароль обновлён. Теперь можно войти.',
      resetFailed: 'Не удалось сбросить пароль',
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

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(128)],
    }),
  });

  constructor() {
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.form.patchValue({ email: emailFromQuery.trim() });
    }
  }

  submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = null;
    this.info = null;

    const payload = this.form.getRawValue();
    this.auth
      .resetPassword(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.info = this.t('passwordUpdated');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          const msg = err?.error?.message || this.t('resetFailed');
          this.error = msg;
        },
      });
  }
}
