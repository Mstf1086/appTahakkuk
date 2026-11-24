import { Injectable, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

// 30 dakika işlem yapılmazsa oturumu güvenlik amacıyla kapatır; her kullanıcı etkileşimi
// (fare/klavye/dokunma) sayacı sıfırlar. Oturum kapandığında tarayıcı verileri AuthService
// tarafından temizlenir (Drive bağlantısı dahil).
@Injectable({ providedIn: 'root' })
export class IdleTimeoutService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private timeoutId: number | null = null;

  constructor() {
    effect(() => {
      if (this.auth.user()) {
        this.restart();
      } else {
        this.stop();
      }
    });

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, this.onActivity, { passive: true });
    }
  }

  private readonly onActivity = (): void => {
    if (this.auth.user()) {
      this.restart();
    }
  };

  private restart(): void {
    this.stop();
    this.timeoutId = window.setTimeout(() => {
      void this.signOutDueToIdle();
    }, IDLE_TIMEOUT_MS);
  }

  private stop(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private async signOutDueToIdle(): Promise<void> {
    if (!this.auth.user()) {
      return;
    }
    await this.auth.logout();
    await this.router.navigate(['/login'], { queryParams: { reason: 'idle' } });
  }
}
