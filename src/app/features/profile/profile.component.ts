import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { toAuthErrorMessage } from '../../core/auth-errors';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly seoService = inject(SeoService);

  constructor() {
    this.seoService.setPage({
      title: 'Profil | Tahakkuk',
      description: 'Tahakkuk hesabınızın profil bilgilerini görüntüleyin ve güncelleyin.',
      path: '/profile',
    });
  }

  readonly user = this.authService.user;
  readonly saving = signal(false);
  readonly message = signal('');
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    displayName: ['', [Validators.maxLength(50)]],
  });

  formatDate(value?: string | null): string {
    if (!value) {
      return '-';
    }
    return new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  async save(): Promise<void> {    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.message.set('');
    this.errorMessage.set('');

    try {
      await this.authService.updateDisplayName(this.form.getRawValue().displayName);
      this.message.set('Profil bilgileriniz güncellendi.');
    } catch (error) {
      this.errorMessage.set(toAuthErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
