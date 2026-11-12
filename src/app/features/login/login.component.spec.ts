import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const stub = {
    isConfigured: true,
    login: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    loginWithGoogle: vi.fn(async () => undefined),
  };

  beforeEach(async () => {
    stub.login.mockResolvedValue(undefined);
    stub.register.mockResolvedValue(undefined);
    stub.loginWithGoogle.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: stub }],
    }).compileComponents();
  });

  it('e-posta ve şifre alanlarını gösterir', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('input[type="email"]')).toBeTruthy();
    expect(element.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('geçerli bilgilerle giriş yapar', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({
      displayName: '',
      email: 'kullanici@example.com',
      password: 'sifre123',
    });

    await fixture.componentInstance.submit();

    expect(stub.login).toHaveBeenCalledWith('kullanici@example.com', 'sifre123');
  });

  it('hatalı girişte Türkçe hata mesajı gösterir', async () => {
    stub.login.mockRejectedValueOnce({ code: 'auth/invalid-credential' });

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({
      displayName: '',
      email: 'kullanici@example.com',
      password: 'yanlis123',
    });

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toBe('E-posta veya şifre hatalı.');
  });

  it('hesap oluşturma moduna geçer', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.toggleMode();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.isRegisterMode).toBe(true);
    expect(element.querySelector('input#displayName')).toBeTruthy();
  });

  it('Google ile giriş düğmesini gösterir ve servisi çağırır', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector('button.google-btn') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.textContent?.includes('Google ile giriş yap')).toBe(true);

    await fixture.componentInstance.loginWithGoogle();
    expect(stub.loginWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('Google girişte engellenen popup için Türkçe hata mesajı gösterir', async () => {
    stub.loginWithGoogle.mockRejectedValueOnce({ code: 'auth/popup-blocked' });

    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.componentInstance.loginWithGoogle();
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toBe(
      'Tarayıcı Google giriş penceresini engelledi. Pop-up engelleyicisini kapatıp tekrar deneyin.',
    );
  });

  it('hesap oluşturma modunda Google düğmesini göstermez', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.toggleMode();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('button.google-btn')).toBeNull();
  });
});
