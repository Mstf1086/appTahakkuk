import { ApplicationRef } from '@angular/core';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { IdleTimeoutService } from './idle-timeout.service';

const THIRTY_MINUTES = 30 * 60 * 1000;

describe('IdleTimeoutService', () => {
  // Test başına yeni stub: önceki testlerin bıraktığı window dinleyicileri bu stuba erişemez.
  let authStub: {
    user: ReturnType<typeof signal<{ uid: string } | null>>;
    waitForAuthState: () => Promise<null>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    authStub = {
      user: signal<{ uid: string } | null>(null),
      waitForAuthState: async () => null,
      logout: vi.fn(async () => undefined),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('kullanıcı giriş yaptığında 30 dakika işlem yapılmazsa çıkış yapar', async () => {
    TestBed.inject(IdleTimeoutService);

    authStub.user.set({ uid: 'u1' });
    TestBed.inject(ApplicationRef).tick();
    await vi.advanceTimersByTimeAsync(THIRTY_MINUTES - 60000);
    expect(authStub.logout).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(70000);
    expect(authStub.logout).toHaveBeenCalledTimes(1);
  });

  it('kullanıcı işlem yapınca sayaç sıfırlanır', async () => {
    TestBed.inject(IdleTimeoutService);
    authStub.user.set({ uid: 'u1' });
    TestBed.inject(ApplicationRef).tick();

    await vi.advanceTimersByTimeAsync(20 * 60 * 1000);
    window.dispatchEvent(new Event('keydown'));
    await vi.advanceTimersByTimeAsync(20 * 60 * 1000);
    expect(authStub.logout).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(11 * 60 * 1000);
    expect(authStub.logout).toHaveBeenCalledTimes(1);
  });

  it('kullanıcı giriş yapmamışsa sayaç çalışmaz', async () => {
    TestBed.inject(IdleTimeoutService);
    TestBed.inject(ApplicationRef).tick();

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(authStub.logout).not.toHaveBeenCalled();
  });
});
