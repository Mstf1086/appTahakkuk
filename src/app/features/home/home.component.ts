import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

interface HomeModule {
  code: string;
  title: string;
  description: string;
  path?: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly seoService = inject(SeoService);

  constructor() {
    this.seoService.setPage({
      title: 'Anasayfa | Tahakkuk',
      description:
        'Tahakkuk anasayfasından modüllere erişin: dosya modülünde iş kayıtlarını yönetin ve Google Drive tablosuna kaydedin, damga vergisi hesaplama aracıyla kesintileri hesaplayın.',
      keywords: 'tahakkuk, anasayfa, dosya modülü, damga vergisi hesaplama',
      path: '/anasayfa',
    });
  }

  readonly mainModules: HomeModule[] = [
    {
      code: 'DS',
      title: 'Dosya Modülü',
      description:
        'İş kayıtlarını oluşturun, düzenleyin ve silin; kayıtlar Google Drive\'daki "dosyalar" tablosuna otomatik yazılır.',
      path: '/modules/dosya',
    },
    {
      code: 'SZ',
      title: 'Sözleşme Modülü',
      description:
        'Dosya kayıtlarına bağlı sözleşmeleri yönetin; kayıtlar "sözleşmeler" tablosuna otomatik yazılır. Erişim Dosya Modülü\'ndeki "Sözleşme Aç" düğmesiyle sağlanır.',
    },
  ];

  readonly helperModules: HomeModule[] = [
    {
      code: 'DV',
      title: 'Damga Vergisi Hesaplama',
      description: 'KDV hariç fatura bedeli üzerinden damga vergisi kesintisi hesaplar.',
      path: '/modules/damga-vergisi-modulu',
    },
  ];
}
