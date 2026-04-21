import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
import { AppLanguage, LanguageService } from '../../../services/language.service';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordHasDigit,
  passwordHasLowercase,
  passwordHasUppercase,
  passwordPolicyValidator,
} from '../../../validators/password-policy.validator';
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
} from 'lucide-angular';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    LanguageSwitcherComponent,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
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

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly language = inject(LanguageService);

  readonly googleUrl = `${environment.apiUrl}/auth/google`;
  readonly githubUrl = `${environment.apiUrl}/auth/github`;

  loading = false;
  error: string | null = null;
  private readonly translations: Record<AppLanguage, Record<string, string>> = {
    en: {
      backToGreenFind: 'Back to GreenFind',
      welcomeBack: 'Welcome Back',
      loginSubtitle: 'Please enter your details to sign in.',
      emailAddress: 'Email Address',
      emailPlaceholder: 'you@example.com',
      emailRequired: 'Email is required.',
      emailInvalid: 'Enter a valid email address.',
      password: 'Password',
      forgot: 'Forgot?',
      passwordRules: 'Password rules:',
      minLengthRule: '- At least 8 characters',
      uppercaseRule: '- One uppercase letter (A-Z)',
      lowercaseRule: '- One lowercase letter (a-z)',
      digitRule: '- One number (0-9)',
      passwordRequired: 'Password is required.',
      passwordMinLength: 'Password must be at least 8 characters.',
      passwordMaxLength: 'Password must be at most 128 characters.',
      passwordInvalid: 'Password does not match the required format.',
      signIn: 'Sign In',
      orContinueWith: 'Or continue with',
      newToGreenFind: 'New to GreenFind?',
      createAccount: 'Create account',
      loginFailed: 'Login failed',
    },
    ru: {
      backToGreenFind: 'Назад в GreenFind',
      welcomeBack: 'С возвращением',
      loginSubtitle: 'Введите данные, чтобы войти в аккаунт.',
      emailAddress: 'Электронная почта',
      emailPlaceholder: 'you@example.com',
      emailRequired: 'Email обязателен.',
      emailInvalid: 'Введите корректный email.',
      password: 'Пароль',
      forgot: 'Забыли?',
      passwordRules: 'Требования к паролю:',
      minLengthRule: '- Минимум 8 символов',
      uppercaseRule: '- Одна заглавная буква (A-Z)',
      lowercaseRule: '- Одна строчная буква (a-z)',
      digitRule: '- Одна цифра (0-9)',
      passwordRequired: 'Пароль обязателен.',
      passwordMinLength: 'Пароль должен содержать минимум 8 символов.',
      passwordMaxLength: 'Пароль должен содержать максимум 128 символов.',
      passwordInvalid: 'Пароль не соответствует формату.',
      signIn: 'Войти',
      orContinueWith: 'Или продолжить через',
      newToGreenFind: 'Впервые в GreenFind?',
      createAccount: 'Создать аккаунт',
      loginFailed: 'Не удалось войти',
    },
  };

  get emailCtrl() {
    return this.form.controls.email;
  }

  get passwordCtrl() {
    return this.form.controls.password;
  }

  get selectedLanguage(): AppLanguage {
    return this.language.currentLanguage();
  }

  setLanguage(language: AppLanguage): void {
    this.language.setLanguage(language);
  }

  t(key: string): string {
    return this.translations[this.selectedLanguage][key] ?? this.translations.en[key] ?? key;
  }

  passwordHasUppercase(): boolean {
    return passwordHasUppercase(this.passwordCtrl.value);
  }

  passwordHasLowercase(): boolean {
    return passwordHasLowercase(this.passwordCtrl.value);
  }

  passwordHasDigit(): boolean {
    return passwordHasDigit(this.passwordCtrl.value);
  }

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(PASSWORD_MIN_LENGTH),
        Validators.maxLength(PASSWORD_MAX_LENGTH),
        passwordPolicyValidator,
      ],
    }),
  });

  submit() {
    if (this.loading) return;
    this.error = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    const payload = this.form.getRawValue();

    this.auth
      .login(payload)
      .pipe(
        switchMap(() => this.auth.fetchMe()),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: () => this.router.navigateByUrl(returnUrl),
        error: (err) => {
          const msg =
            (typeof err?.error === 'string' && err.error) ||
            err?.error?.message ||
            err?.message ||
            this.t('loginFailed');
          this.error = msg;
          this.form.markAllAsTouched();
        },
      });
  }
}
