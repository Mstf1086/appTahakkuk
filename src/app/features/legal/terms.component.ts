import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './terms.component.css',
})
export class TermsComponent {
  private readonly seoService = inject(SeoService);

  constructor() {
    this.seoService.setPage({
      title: 'Kullanım Koşulları | Tahakkuk',
      description:
        'Tahakkuk uygulamasının kullanım koşulları: hizmetin kapsamı, damga vergisi hesaplama sonuçlarının yorumu, sorumluluk sınırları ve uygulanacak hukuk.',
      keywords: 'kullanım koşulları, tahakkuk, damga vergisi hesaplama',
      path: '/terms',
    });
  }
}
