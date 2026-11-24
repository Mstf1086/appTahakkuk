import { ErrorHandler, Injectable } from '@angular/core';
import { writeErrorLog } from './error-logger';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    writeErrorLog('error', 'Yakalanmamış uygulama hatası', error);
  }
}
