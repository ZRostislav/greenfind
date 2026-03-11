import { Routes } from '@angular/router';
import { MainComponent } from './components/main/main.component';
import { ResultsComponent } from './components/results/results.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'results', component: ResultsComponent },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./components/auth/verify-email/verify-email.component').then(
        (m) => m.VerifyEmailComponent,
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./components/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'oauth-callback',
    loadComponent: () =>
      import('./components/auth/oauth-callback/oauth-callback.component').then(
        (m) => m.OauthCallbackComponent,
      ),
  },
  {
    path: 'me',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/user/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/user/history/history.component').then((m) => m.HistoryComponent),
  },
  { path: '**', redirectTo: '' },
];
