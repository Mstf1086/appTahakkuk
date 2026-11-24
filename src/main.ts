import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { writeErrorLog } from './app/core/error-logger';
import { installGlobalErrorListeners } from './app/core/global-error-listeners';

// Bootstrap öncesinde kurulur: açılış sırasındaki hatalar da kaydedilir.
installGlobalErrorListeners();

bootstrapApplication(AppComponent, appConfig).catch((error: unknown) => {
  writeErrorLog('error', 'Uygulama başlatılamadı', error);
});
