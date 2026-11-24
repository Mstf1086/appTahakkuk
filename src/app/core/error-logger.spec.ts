import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorLogger, normalizeError, writeErrorLog } from './error-logger';

describe('ErrorLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hatayı [Tahakkuk] önekiyle konsola yazar', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    new ErrorLogger().error('Test işlemi başarısız', new Error('patlama'));

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [header, error] = errorSpy.mock.calls[0] as [string, Error];
    expect(header).toContain('[Tahakkuk] [HATA] Test işlemi başarısız');
    expect(header).toContain('patlama');
    expect(error).toBeInstanceOf(Error);
    expect(error.stack).toBeTruthy();
  });

  it('uyarıları console.warn ile yazar', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    new ErrorLogger().warn('Depolama erişimi kapalı', new Error('quota'));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('[Tahakkuk] [UYARI] Depolama erişimi kapalı');
  });

  it('Hata olmayan değerleri Error örneğine dönüştürür', () => {
    expect(normalizeError('TOKEN_ERROR').message).toBe('TOKEN_ERROR');
    expect(normalizeError({ code: 'auth/popup-closed-by-user' }).message).toBe(
      'auth/popup-closed-by-user',
    );
    expect(normalizeError(undefined).message).toBe('undefined');
  });

  it('Firebase hata kodunu ek ayrıntı olarak yazar', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const firebaseError = Object.assign(new Error('popup closed'), {
      code: 'auth/popup-closed-by-user',
    });

    writeErrorLog('error', 'Google ile giriş başarısız', firebaseError);

    const details = errorSpy.mock.calls[0][2] as Record<string, unknown>;
    expect(details['code']).toBe('auth/popup-closed-by-user');
  });

  it('Verilen ek ayrıntıları korur', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    writeErrorLog('error', 'Yönlendirme hatası', new Error('rota yok'), { rota: '/profile' });

    const details = errorSpy.mock.calls[0][2] as Record<string, unknown>;
    expect(details['rota']).toBe('/profile');
  });
});
