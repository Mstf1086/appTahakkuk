import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  private readonly seoService = inject(SeoService);

  constructor() {
    this.seoService.setPage({
      title: 'Dashboard | Tahakkuk',
      description:
        'Tahakkuk panosunda modüllere erişin, damga vergisi hesaplayın ve güncel durum özetini izleyin.',
      keywords: 'tahakkuk paneli, dashboard, modüller',
      path: '/dashboard',
    });
  }

  readonly modules: DashboardModule[] = [
    {
      code: 'DV',
      title: 'Damga Vergisi Hesaplama',
      description: 'KDV hariç fatura bedeli üzerinden damga vergisi kesintisi hesaplar.',
      path: '/modules/stamp-tax',
    },
  ];
}
