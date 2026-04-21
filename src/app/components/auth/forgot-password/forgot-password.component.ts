import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
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
  LifeBuoyIcon,
} from 'lucide-angular';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    LanguageSwitcherComponent,
  ],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
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
  readonly LifeBuoyIcon = LifeBuoyIcon;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);

  loading = false;
  error: string | null = null;
  info: string | null = null;
  private readonly translations: Record<AppLanguage, Record<string, string>> = {
    en: {
      backToSignIn: 'Back to Sign In',
      recovery: 'Recovery',
      subtitle: "Enter your email and we'll send you a 6-digit reset code.",
      registeredEmail: 'Registered Email',
      emailPlaceholder: 'you@example.com',
      sendResetCode: 'Send Reset Code',
      secureIdentityService: 'Secure Identity Service',
      resetSent: 'If the email exists, a reset code was sent.',
    },
    ru: {
      backToSignIn: 'Назад ко входу',
      recovery: 'Восстановление',
      subtitle: 'Введите email, и мы отправим 6-значный код для сброса пароля.',
      registeredEmail: 'Зарегистрированный email',
      emailPlaceholder: 'you@example.com',
      sendResetCode: 'Отправить код',
      secureIdentityService: 'Безопасный сервис идентификации',
      resetSent: 'Если email существует, код сброса уже отправлен.',
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
  });

  submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = null;
    this.info = null;

    const payload = this.form.getRawValue();
    this.auth
      .requestPasswordReset(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.info = this.t('resetSent');
          this.router.navigate(['/reset-password'], { queryParams: { email: payload.email } });
        },
        error: () => {
          this.info = this.t('resetSent');
          this.router.navigate(['/reset-password'], { queryParams: { email: payload.email } });
        },
      });
  }
}
