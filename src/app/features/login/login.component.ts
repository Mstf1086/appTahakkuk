import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthMode, AuthService } from '../../core/auth.service';
import { toAuthErrorMessage } from '../../core/auth-errors';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);

  readonly mode = signal<AuthMode>('login');
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly isConfigured = this.authService.isConfigured;

  constructor() {
    this.seoService.setPage({
      title: 'Giriş | Tahakkuk',
      description:
        'Tahakkuk panosuna giriş yapın veya ücretsiz hesap oluşturun; damga vergisi hesaplama modülü misafirler için açıktır.',
      keywords: 'tahakkuk giriş, damga vergisi hesaplama, tahakkuk paneli',
      path: '/login',
    });
  }

  readonly form = this.formBuilder.nonNullable.group({
    displayName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get isRegisterMode(): boolean {
    return this.mode() === 'register';
  }

  toggleMode(): void {
    this.mode.update((mode) => (mode === 'login' ? 'register' : 'login'));
    this.errorMessage.set('');
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { displayName, email, password } = this.form.getRawValue();

    try {
      if (this.isRegisterMode) {
        await this.authService.register(email, password, displayName);
      } else {
        await this.authService.login(email, password);
      }
      await this.router.navigateByUrl(this.returnUrl());
    } catch (error) {
      this.errorMessage.set(toAuthErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  private returnUrl(): string {
    const target = this.route.snapshot.queryParamMap.get('returnUrl');
    return target && target.startsWith('/') ? target : '/dashboard';
  }
}
