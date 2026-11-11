import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  const stub = {
    waitForAuthState: vi.fn(async () => null),
  };

  beforeEach(() => {
    stub.waitForAuthState.mockResolvedValue(null);

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: stub }],
    });
  });

  it('kimlik doğrulanmamış kullanıcıyı login sayfasına yönlendirir', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );

    expect(result instanceof UrlTree).toBe(true);
    expect(String(result)).toContain('/login');
  });

  it('kimliği doğrulanmış kullanıcıya erişim verir', async () => {
    stub.waitForAuthState.mockResolvedValue({ uid: 'user-1' } as never);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });
});
