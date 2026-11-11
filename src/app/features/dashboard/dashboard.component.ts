import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SeoService } from '../../core/seo.service';

interface DashboardModule {
  code: string;
  title: string;
  description: string;
  path?: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly seoService = inject(SeoService);

  readonly user = this.authService.user;

  constructor() {
    this.seoService.setPage({
      title: 'Dashboard | Tahakkuk',
      description:
        'Tahakkuk panosunda modüllere erişin, damga vergisi hesaplayın ve güncel durum özetini izleyin.',
      keywords: 'tahakkuk paneli, dashboard, modüller',
      path: '/dashboard',
    });
  }

  readonly cards = [
    { title: 'Toplam tahakkuk', value: '—', hint: 'Veri bağlandığında burada görünecek' },
    { title: 'Bekleyen ödeme', value: '—', hint: 'Veri bağlandığında burada görünecek' },
    { title: 'Bu ay', value: '—', hint: 'Veri bağlandığında burada görünecek' },
  ];

  readonly modules: DashboardModule[] = [
    {
      code: 'DV',
      title: 'Damga Vergisi Hesaplama',
      description: 'KDV hariç fatura bedeli üzerinden damga vergisi kesintisi hesaplar.',
      path: '/modules/stamp-tax',
    },
  ];

  readonly activities = [
    { title: 'Hesap oluşturuldu', hint: 'Firebase Authentication üzerinden giriş yapıldı' },
    { title: 'Oturum başlatıldı', hint: 'Giriş sonrası oturum güvenli şekilde açıldı' },
    { title: 'Profil güncellendi', hint: 'Profil sayfasından görünen bilgiler düzenlenebilir' },
  ];
}
