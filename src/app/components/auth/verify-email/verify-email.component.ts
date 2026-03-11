import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify-email.component.html',
})
export class VerifyEmailComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  verifying = false;
  resending = false;
  error: string | null = null;
  info: string | null = null;

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{6}$/)] }),
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
          const msg = err?.error?.message || 'Verification failed';
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
          this.info = 'A new code has been sent (check your email or server console if EMAIL_ENABLED=false).';
        },
        error: () => {
          this.info = 'If the email exists, a new code was sent.';
        },
      });
  }
}

