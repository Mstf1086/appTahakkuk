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
    await harness.navigateByUrl('/modules/damga-vergisi-modulu');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Damga Vergisi Hesaplama',
    );
  });

  it('damga vergisi modülü üst menü ile birlikte açılır', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/modules/damga-vergisi-modulu');

    expect(document.querySelector('.topbar')).toBeTruthy();
    expect(document.body.textContent).toContain('Anasayfa');
    expect(document.body.textContent).toContain(`Sürüm ${APP_VERSION}`);
  });

  it('damga vergisi modülü menüde listelenmez', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/modules/damga-vergisi-modulu');

    const nav = document.querySelector('.desktop-nav');
    expect(nav?.textContent).not.toContain('Damga Vergisi');
  });

  it('misafirler varsayılan olarak anasayfaya erişebilir', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');

    const router = TestBed.inject(Router);
    expect(router.url).toContain('/anasayfa');
    expect(document.body.textContent).toContain('Giriş yap');
  });

  it('misafirler profil sayfasına gidemez', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile');

    const router = TestBed.inject(Router);
    expect(router.url).toContain('/login');
  });

  it('anasayfa ana ve yardımcı modülleri ayrı kartlarda listeler', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/anasayfa');

    const text = harness.routeNativeElement?.textContent ?? '';
    expect(text).toContain('Ana Modüller');
    expect(text).toContain('Yardımcı Modüller');
    expect(text).toContain('Dosya Modülü');
    expect(text).toContain('Damga Vergisi Hesaplama');
  });

  it('misafirler gizlilik politikası sayfasına erişebilir', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/policy');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Gizlilik Politikası',
    );
    expect(document.querySelector('.topbar')).toBeTruthy();
  });

  it('misafirler kullanım koşulları sayfasına erişebilir', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/terms');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Kullanım Koşulları',
    );
  });

  it('misafirler dosya modülüne erişebilir', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/modules/dosya');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Dosya Modülü');
    expect(harness.routeNativeElement?.textContent).toContain('Yeni kayıt');
  });

  it('dosya modülü menüde listelenmez', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/modules/dosya');

    const nav = document.querySelector('.desktop-nav');
    expect(nav?.textContent).not.toContain('Dosya');
  });
});
