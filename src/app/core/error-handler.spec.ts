import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appConfig } from '../app.config';
import { GlobalErrorHandler } from './error-handler';

describe('GlobalErrorHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('yakalanmamış hatayı konsola yazar', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    new GlobalErrorHandler().handleError(new Error('bozuk durum'));

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain(
      '[Tahakkuk] [HATA] Yakalanmamış uygulama hatası',
    );
  });

  it('uygulama yapılandırmasında ErrorHandler olarak bağlıdır', () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });

    expect(TestBed.inject(ErrorHandler)).toBeInstanceOf(GlobalErrorHandler);
  });
});
