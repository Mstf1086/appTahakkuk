import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { GoogleDriveService } from './core/google-drive.service';
import { IdleTimeoutService } from './core/idle-timeout.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly idleTimeout = inject(IdleTimeoutService);
  private readonly auth = inject(AuthService);
  private readonly drive = inject(GoogleDriveService);

  constructor() {
    // Kullanıcı giriş yaptığında Google Drive bağlantısı doğrudan kurulur: daha önce
    // izin verilmişse pencere açılmadan (sessiz yenileme), ilk kezse tek seferlik
    // onay penceresiyle. Çıkışta bağlantı kaydı korunur; yeni girişte yeniden bağlanılır.
    effect(() => {
      const user = this.auth.user();
      if (!user) {
        return;
      }
      untracked(() => void this.drive.connectAfterSignIn());
    });
  }
}