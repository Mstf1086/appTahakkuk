import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './core/auth.service';
import { APP_VERSION } from './core/app-info';
import { routes } from './app.routes';

describe('app routes', () => {
  const authStub = {
    user: signal(null),
    waitForAuthState: async () => null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: AuthService, useValue: authStub }],
    }).compileComponents();
  });

  it('misafirler damga vergisi modülüne erişebilir', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/modules/stamp-tax');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Damga Vergisi Hesaplama',
    );
  });

  it('damga vergisi modülü üst menü ile birlikte açılır', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/modules/stamp-tax');

    expect(document.querySelector('.topbar')).toBeTruthy();
    expect(document.body.textContent).toContain('Dashboard');
    expect(document.body.textContent).toContain(`Sürüm ${APP_VERSION}`);
  });

  it('damga vergisi modülü menüde listelenmez', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/modules/stamp-tax');

    const nav = document.querySelector('.desktop-nav');
    expect(nav?.textContent).not.toContain('Damga Vergisi');
  });

  it('misafirler varsayılan olarak dashboard sayfasına erişebilir', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');

    const router = TestBed.inject(Router);
    expect(router.url).toContain('/dashboard');
    expect(document.body.textContent).toContain('Giriş yap');
  });

  it('misafirler profil sayfasına gidemez', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile');

    const router = TestBed.inject(Router);
    expect(router.url).toContain('/login');
  });
});
