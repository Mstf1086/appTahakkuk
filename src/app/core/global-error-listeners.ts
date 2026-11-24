import { writeErrorLog } from './error-logger';

let dispose: (() => void) | null = null;

/**
 * Angular'ın hata denetimine girmeyen hataları yakalar:
 * - `window.onerror`: çalışma zamanı hataları ve yüklenemeyen kaynaklar
 * - `unhandledrejection`: yakalanmamış Promise reddi
 *
 * Kurulum `main.ts` içinde bootstrap öncesinde yapılır; böylece uygulama
 * açılış sırasındaki hatalar da kaydedilir. D çağrıldığında dinleyiciler kaldırılır.
 */
export function installGlobalErrorListeners(): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }
  if (dispose) {
    return dispose;
  }

  const onError = (event: ErrorEvent): void => {
    if (event.error || event.message) {
      writeErrorLog('error', 'Tarayıcı hatası (window.onerror)', event.error ?? event.message, {
        dosya: event.filename,
        satir: event.lineno,
        sutun: event.colno,
      });
      // Tarayıcının kendi "Uncaught" kaydıyla yinelenmeyi önler.
      event.preventDefault();
      return;
    }

    const target = event.target;
    if (target instanceof Element) {
      writeErrorLog('warn', 'Kaynak yüklenemedi', new Error('Kaynak yükleme hatası'), {
        kaynak: target.getAttribute('src') ?? target.getAttribute('href') ?? target.tagName,
      });
    }
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
    writeErrorLog('error', 'İşlenmemiş Promise reddi (unhandledrejection)', event.reason);
    event.preventDefault();
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  dispose = () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
    dispose = null;
  };

  return dispose;
}
