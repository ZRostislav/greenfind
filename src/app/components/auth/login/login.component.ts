import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly googleUrl = `${environment.apiUrl}/auth/google`;
  readonly githubUrl = `${environment.apiUrl}/auth/github`;

  loading = false;
  error: string | null = null;

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = null;

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
          const msg = err?.error?.message || 'Login failed';
          this.error = msg;
        },
      });
  }
}

