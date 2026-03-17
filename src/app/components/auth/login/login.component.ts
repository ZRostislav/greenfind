import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
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

  readonly googleUrl = `${environment.apiUrl}/auth/google`;
  readonly githubUrl = `${environment.apiUrl}/auth/github`;

  loading = false;
  error: string | null = null;

  get emailCtrl() {
    return this.form.controls.email;
  }

  get passwordCtrl() {
    return this.form.controls.password;
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
            'Login failed';
          this.error = msg;
          this.form.markAllAsTouched();
        },
      });
  }
}
