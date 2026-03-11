import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  error: string | null = null;
  info: string | null = null;

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
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
          this.info = 'If the email exists, a reset code was sent.';
          this.router.navigate(['/reset-password'], { queryParams: { email: payload.email } });
        },
        error: () => {
          this.info = 'If the email exists, a reset code was sent.';
          this.router.navigate(['/reset-password'], { queryParams: { email: payload.email } });
        },
      });
  }
}

