import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { matchFieldsValidator } from '../../../validators/match-fields.validator';
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
} from 'lucide-angular';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    LanguageSwitcherComponent,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
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

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly language = inject(LanguageService);

  loading = false;
  error: string | null = null;
  private readonly translations: Record<AppLanguage, Record<string, string>> = {
    en: {
      backToGreenFind: 'Back to GreenFind',
      joinUs: 'Join Us',
      subtitle: 'Start your eco-friendly search journey.',
      username: 'Username',
      usernamePlaceholder: 'username',
      usernameRequired: 'Username is required.',
      usernameMin: 'Username must be at least 5 characters.',
      usernameMax: 'Username must be at most 30 characters.',
      usernameTaken: 'This username is already taken.',
      usernameHint: '5-30 characters.',
      emailAddress: 'Email Address',
      emailPlaceholder: 'hello@example.com',
      emailRequired: 'Email is required.',
      emailInvalid: 'Enter a valid email address.',
      emailTaken: 'This email is already in use.',
      password: 'Password',
      passwordRules: 'Password rules:',
      minLengthRule: '- At least 8 characters',
      uppercaseRule: '- One uppercase letter (A-Z)',
      lowercaseRule: '- One lowercase letter (a-z)',
      digitRule: '- One number (0-9)',
      passwordRequired: 'Password is required.',
      passwordMinLength: 'Password must be at least 8 characters.',
      passwordMaxLength: 'Password must be at most 128 characters.',
      passwordInvalid: 'Password does not match the required format.',
      repeatPassword: 'Repeat Password',
      repeatPasswordRequired: 'Repeat password is required.',
      passwordsMismatch: 'Passwords do not match.',
      fillFormTooltip: 'Fill in the form correctly to continue',
      createAccount: 'Create account',
      alreadyHaveAccount: 'Already have an account?',
      signIn: 'Sign in',
      terms: 'By signing up, you agree to our Terms of Service.',
      registrationFailed: 'Registration failed',
    },
    ru: {
      backToGreenFind: 'Назад в GreenFind',
      joinUs: 'Присоединяйтесь',
      subtitle: 'Начните экологичный поиск вместе с нами.',
      username: 'Имя пользователя',
      usernamePlaceholder: 'username',
      usernameRequired: 'Имя пользователя обязательно.',
      usernameMin: 'Имя пользователя должно быть не короче 5 символов.',
      usernameMax: 'Имя пользователя должно быть не длиннее 30 символов.',
      usernameTaken: 'Это имя пользователя уже занято.',
      usernameHint: 'От 5 до 30 символов.',
      emailAddress: 'Электронная почта',
      emailPlaceholder: 'hello@example.com',
      emailRequired: 'Email обязателен.',
      emailInvalid: 'Введите корректный email.',
      emailTaken: 'Этот email уже используется.',
      password: 'Пароль',
      passwordRules: 'Требования к паролю:',
      minLengthRule: '- Минимум 8 символов',
      uppercaseRule: '- Одна заглавная буква (A-Z)',
      lowercaseRule: '- Одна строчная буква (a-z)',
      digitRule: '- Одна цифра (0-9)',
      passwordRequired: 'Пароль обязателен.',
      passwordMinLength: 'Пароль должен содержать минимум 8 символов.',
      passwordMaxLength: 'Пароль должен содержать максимум 128 символов.',
      passwordInvalid: 'Пароль не соответствует формату.',
      repeatPassword: 'Повторите пароль',
      repeatPasswordRequired: 'Повтор пароля обязателен.',
      passwordsMismatch: 'Пароли не совпадают.',
      fillFormTooltip: 'Заполните форму корректно, чтобы продолжить',
      createAccount: 'Создать аккаунт',
      alreadyHaveAccount: 'Уже есть аккаунт?',
      signIn: 'Войти',
      terms: 'Регистрируясь, вы соглашаетесь с условиями сервиса.',
      registrationFailed: 'Не удалось зарегистрироваться',
    },
  };

  get usernameCtrl() {
    return this.form.controls.username;
  }

  get emailCtrl() {
    return this.form.controls.email;
  }

  get passwordCtrl() {
    return this.form.controls.password;
  }

  get confirmPasswordCtrl() {
    return this.form.controls.confirmPassword;
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

  private setTakenError(control: AbstractControl, taken: boolean) {
    const existing = control.errors || {};
    if (taken) {
      control.setErrors({ ...existing, taken: true });
      return;
    }
    if (!existing['taken']) return;
    const { taken: _taken, ...rest } = existing;
    control.setErrors(Object.keys(rest).length ? rest : null);
  }

  private applyServerFieldErrors(err: any) {
    const code = String(err?.error?.code || '');
    const status = Number(err?.status || 0);
    const message = String(
      (typeof err?.error === 'string' && err.error) || err?.error?.message || err?.message || '',
    );
    const errors = err?.error?.errors;

    const matchTaken = (text: string) =>
      /(taken|already|exists|in use|occupied|занят|существует|уже используется)/i.test(text);

    const emailErrText =
      (typeof errors?.email === 'string' && errors.email) ||
      (Array.isArray(errors?.email) ? errors.email.join(' ') : '');
    const statusIndicatesEmail = status === 409 && /email/i.test(`${emailErrText} ${message}`);
    const emailTaken =
      code === 'EMAIL_TAKEN' ||
      statusIndicatesEmail ||
      (emailErrText && matchTaken(emailErrText)) ||
      (/email/i.test(message) && matchTaken(message));

    const usernameErrText =
      (typeof errors?.username === 'string' && errors.username) ||
      (Array.isArray(errors?.username) ? errors.username.join(' ') : '');
    const statusIndicatesUsername =
      status === 409 && /(user(name)?|nick(name)?|login)/i.test(`${usernameErrText} ${message}`);
    const usernameTaken =
      code === 'USERNAME_TAKEN' ||
      code === 'NICKNAME_TAKEN' ||
      statusIndicatesUsername ||
      (usernameErrText && matchTaken(usernameErrText)) ||
      (/user(name)?|nick(name)?|login/i.test(message) && matchTaken(message));

    if (emailTaken) this.setTakenError(this.emailCtrl, true);
    if (usernameTaken) this.setTakenError(this.usernameCtrl, true);
  }

  readonly form = new FormGroup(
    {
      username: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(5), Validators.maxLength(30)],
      }),
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
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [matchFieldsValidator('password', 'confirmPassword', 'passwordMismatch')] },
  );

  constructor() {
    this.usernameCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.error = null;
        this.setTakenError(this.usernameCtrl, false);
      });
    this.emailCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.error = null;
        this.setTakenError(this.emailCtrl, false);
      });

    this.passwordCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.confirmPasswordCtrl.updateValueAndValidity({ onlySelf: true }));
  }

  submit() {
    if (this.loading) return;
    this.error = null;
    this.setTakenError(this.emailCtrl, false);
    this.setTakenError(this.usernameCtrl, false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const { confirmPassword: _confirmPassword, ...payload } = this.form.getRawValue();

    this.auth
      .register(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () =>
          this.router.navigate(['/verify-email'], { queryParams: { email: payload.email } }),
        error: (err) => {
          const msg =
            (typeof err?.error === 'string' && err.error) ||
            err?.error?.message ||
            err?.message ||
            this.t('registrationFailed');
          this.error = msg;
          this.applyServerFieldErrors(err);
          this.form.markAllAsTouched();
        },
      });
  }
}
