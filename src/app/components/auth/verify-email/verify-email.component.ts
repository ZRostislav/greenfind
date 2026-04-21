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
} from 'lucide-angular';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    LanguageSwitcherComponent,
  ],
  templateUrl: './verify-email.component.html',
})
export class VerifyEmailComponent {
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

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly language = inject(LanguageService);

  verifying = false;
  resending = false;
  error: string | null = null;
  info: string | null = null;
  private readonly translations: Record<AppLanguage, Record<string, string>> = {
    en: {
      backToSignIn: 'Back to Sign In',
      securityCheck: 'Security Check',
      subtitle: "We've sent a 6-digit verification code to your inbox.",
      account: 'Account',
      verificationCode: 'Verification Code',
      confirmAccess: 'Confirm Access',
      resending: 'Resending Code...',
      resendHint: "Didn't get the code? Resend",
      verificationFailed: 'Verification failed',
      resendSent:
        'A new code has been sent (check your email or server console if EMAIL_ENABLED=false).',
      resendMasked: 'If the email exists, a new code was sent.',
    },
    ru: {
      backToSignIn: 'Назад ко входу',
      securityCheck: 'Проверка безопасности',
      subtitle: 'Мы отправили 6-значный код подтверждения на вашу почту.',
      account: 'Аккаунт',
      verificationCode: 'Код подтверждения',
      confirmAccess: 'Подтвердить вход',
      resending: 'Повторная отправка...',
      resendHint: 'Не получили код? Отправить снова',
      verificationFailed: 'Не удалось подтвердить email',
      resendSent:
        'Новый код отправлен (проверьте email или консоль сервера, если EMAIL_ENABLED=false).',
      resendMasked: 'Если email существует, новый код уже отправлен.',
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
  });

  constructor() {
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    const pending = this.auth.getPendingEmail();
    const email = (emailFromQuery || pending || '').trim();
    if (email) {
      this.form.patchValue({ email });
    }
  }

  verify() {
    if (this.form.invalid || this.verifying) return;
    this.verifying = true;
    this.error = null;
    this.info = null;

    const payload = this.form.getRawValue();
    this.auth
      .verifyEmail(payload)
      .pipe(finalize(() => (this.verifying = false)))
      .subscribe({
        next: () => this.router.navigate(['/login']),
        error: (err) => {
          const msg = err?.error?.message || this.t('verificationFailed');
          this.error = msg;
        },
      });
  }

  resend() {
    const email = this.form.controls.email.value.trim();
    if (!email || this.resending) return;
    this.resending = true;
    this.error = null;
    this.info = null;

    this.auth
      .resendVerificationCode({ email })
      .pipe(finalize(() => (this.resending = false)))
      .subscribe({
        next: () => {
          this.info = this.t('resendSent');
        },
        error: () => {
          this.info = this.t('resendMasked');
        },
      });
  }
}
