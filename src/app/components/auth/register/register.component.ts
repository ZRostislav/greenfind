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

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
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

  loading = false;
  error: string | null = null;

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
            'Registration failed';
          this.error = msg;
          this.applyServerFieldErrors(err);
          this.form.markAllAsTouched();
        },
      });
  }
}
