import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthStateService } from '../services/auth-state.service';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const resolve = () =>
    authState.user?.role === 'admin' ? true : router.createUrlTree(['/results']);

  if (!authState.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (authState.user) {
    return resolve();
  }

  return authService.fetchMe().pipe(
    map(() => resolve()),
    catchError(() => of(router.createUrlTree(['/results']))),
  );
};
