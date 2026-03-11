import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AuthStateService } from '../services/auth-state.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly authState: AuthStateService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authState.accessToken;
    const isApiRequest = req.url.startsWith(environment.apiUrl);

    const authReq =
      token && isApiRequest
        ? req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          })
        : req;

    return next.handle(authReq).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          this.authState.clearSession();
        }
        return throwError(() => err);
      }),
    );
  }
}
