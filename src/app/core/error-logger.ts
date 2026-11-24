import { Injectable } from '@angular/core';

export type ErrorLogLevel = 'error' | 'warn';

export interface ErrorLogDetails {
  [key: string]: unknown;
}

const LEVEL_LABELS: Record<ErrorLogLevel, string> = {
  error: 'HATA',
  warn: 'UYARI',
};

/** Hata olmayan değerleri yazdırılabilir bir `Error` örneğine dönüştürür. */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  if (error && typeof error === 'object') {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') {
      return new Error(code);
    }
    try {
      return new Error(JSON.stringify(error));
    } catch {
      return new Error(String(error));
    }
  }
  return new Error(String(error));
}

/** Hatanın özetini (ad, mesaj, yığın izi, Firebase hata kodu) üretir. */
export function describeError(error: unknown): {
  name: string;
  message: string;
  stack?: string;
  code?: string;
} {
  const normalized = normalizeError(error);
  const code = error && typeof error === 'object' ? (error as { code?: unknown }).code : undefined;

  return {
    name: normalized.name,
    message: normalized.message,
    stack: normalized.stack,
    code: typeof code === 'string' ? code : undefined,
  };
}

/**
 * Tüm hata günlüklerinin tek biçimde konsola yazılmasını sağlar.
 * Çıktı: `[Tahakkuk] [HATA] <bağlam> | <zaman damgası> | <ad>: <mesaj>`
 * Ardından hatanın kendisi ve varsa ek ayrıntılar (hata kodu, kaynak, satır) yazılır.
 */
export function writeErrorLog(
  level: ErrorLogLevel,
  context: string,
  error: unknown,
  details?: ErrorLogDetails,
): void {
  const summary = describeError(error);
  const normalized = normalizeError(error);
  const extra: ErrorLogDetails = { ...details };

  if (summary.code && extra['code'] === undefined) {
    extra['code'] = summary.code;
  }

  const header =
    `[Tahakkuk] [${LEVEL_LABELS[level]}] ${context} | ` +
    `${new Date().toISOString()} | ${summary.name}: ${summary.message}`;

  const args: unknown[] = [header, normalized];
  if (Object.keys(extra).length > 0) {
    args.push(extra);
  }

  if (level === 'error') {
    console.error(...args);
  } else {
    console.warn(...args);
  }
}

/**
 * Hata denetiminin merkezi: servisler ve bileşenler hatalarını buradan yazar.
 * Böylece biçim, önek ve ayrıntılar her yerde aynıdır.
 */
@Injectable({ providedIn: 'root' })
export class ErrorLogger {
  error(context: string, error: unknown, details?: ErrorLogDetails): void {
    writeErrorLog('error', context, error, details);
  }

  warn(context: string, error: unknown, details?: ErrorLogDetails): void {
    writeErrorLog('warn', context, error, details);
  }
}
