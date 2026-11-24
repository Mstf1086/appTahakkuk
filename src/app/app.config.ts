import { registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr';
import { ApplicationConfig, ErrorHandler, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';

import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/error-handler';
import { writeErrorLog } from './core/error-logger';

registerLocaleData(localeTr, 'tr-TR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withNavigationErrorHandler((navigationError) => {
        // Yönlendirme hataları Angular'ın varsayılan işleyicisine girmeden burada kaydedilir.
        writeErrorLog('error', 'Sayfa yönlendirme hatası', navigationError.error, {
          url: navigationError.url,
        });
      }),
    ),
    { provide: LOCALE_ID, useValue: 'tr-TR' },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
