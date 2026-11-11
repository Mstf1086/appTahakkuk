import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../core/auth.service';
import { APP_VERSION } from '../core/app-info';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  const stub = {
    user: signal<{ email: string } | null>({ email: 'kullanici@example.com' }),
    logout: vi.fn(async () => undefined),
  };

  beforeEach(async () => {
    stub.logout.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: stub }],
    }).compileComponents();
  });

  it('dashboard, profil ve çıkış menülerini gösterir', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Dashboard');
    expect(element.textContent).toContain('Profil');
    expect(element.textContent).toContain('Çıkış');
  });

  it('giriş yapmış kullanıcının e-postasını gösterir', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('kullanici@example.com');
  });

  it('altbilgide sürüm bilgisini gösterir', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.footer')?.textContent).toContain(`Sürüm ${APP_VERSION}`);
  });

  it('misafirler için giriş bağlantısı gösterir', () => {
    stub.user.set(null);

    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Giriş yap');
    expect(element.textContent).not.toContain('Çıkış');
  });

  it('misafirlere profil bağlantısı göstermez', () => {
    stub.user.set(null);

    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).not.toContain('Profil');
  });

  it('footer yalnızca marka, telif ve sürüm gösterir', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const footer = (fixture.nativeElement as HTMLElement).querySelector('.footer');
    expect(footer?.querySelector('a')).toBeNull();
    expect(footer?.textContent).toContain('Tahakkuk');
    expect(footer?.textContent).toContain(`Sürüm ${APP_VERSION}`);
  });

  it('mobil menüyü açıp kapatabilir', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.menuOpen()).toBe(false);

    fixture.componentInstance.toggleMenu();
    fixture.detectChanges();
    expect(fixture.componentInstance.menuOpen()).toBe(true);

    fixture.componentInstance.closeMenu();
    fixture.detectChanges();
    expect(fixture.componentInstance.menuOpen()).toBe(false);
  });

  it('çıkış yapıldığında oturumu kapatır', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    await fixture.componentInstance.logout();

    expect(stub.logout).toHaveBeenCalled();
  });
});
