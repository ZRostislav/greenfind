import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AuthStateService } from '../../../services/auth-state.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  readonly user$ = this.authState.user$;

  logout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/'));
  }
}
