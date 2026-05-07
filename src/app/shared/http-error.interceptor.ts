import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from './toast.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message: string;

      switch (error.status) {
        case 0:
          message = 'No connection to the server. Please check your network.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 500:
          message = 'An unexpected server error occurred. Please try again.';
          break;
        default:
          message = `Request failed (${error.status}). Please try again.`;
      }

      toast.show(message);
      return throwError(() => error);
    })
  );
};
