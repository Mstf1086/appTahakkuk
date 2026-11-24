import { afterEach, describe, expect, it, vi } from 'vitest';
import { installGlobalErrorListeners } from './global-error-listeners';

describe('global hata dinleyicileri', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tarayıcı hatasını konsola yazar', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const dispose = installGlobalErrorListeners();

    window.dispatchEvent(
      new ErrorEvent('error', {
        message: 'global hata',
        filename: 'app.js',
        lineno: 12,
        colno: 4,
        error: new Error('global hata'),
      }),
    );

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain(
      '[Tahakkuk] [HATA] Tarayıcı hatası (window.onerror)',
    );
    dispose();
  });

  it('işlenmemiş Promise reddini konsola yazar', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const dispose = installGlobalErrorListeners();

    const event = new Event('unhandledrejection', { cancelable: true });
    Object.defineProperty(event, 'reason', { value: new Error('reddedildi') });
    window.dispatchEvent(event);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain(
      '[Tahakkuk] [HATA] İşlenmemiş Promise reddi (unhandledrejection)',
    );
    dispose();
  });

  it('ikinci kurulumda dinleyicileri çoğaltmaz', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const dispose = installGlobalErrorListeners();
    installGlobalErrorListeners();

    window.dispatchEvent(
      new ErrorEvent('error', { message: 'global hata', error: new Error('global hata') }),
    );

    expect(errorSpy).toHaveBeenCalledTimes(1);
    dispose();
  });
});
