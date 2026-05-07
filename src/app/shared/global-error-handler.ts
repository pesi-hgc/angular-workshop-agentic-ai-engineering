import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toast = inject(ToastService);

  handleError(error: unknown): void {
    console.error('[GlobalErrorHandler]', error);
    this.toast.show('An unexpected error occurred.');
  }
}
