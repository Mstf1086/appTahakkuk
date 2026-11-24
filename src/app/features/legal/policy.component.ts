import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './policy.component.css',
})
export class PolicyComponent {
  private readonly seoService = inject(SeoService);

  constructor() {
    this.seoService.setPage({
      title: 'Gizlilik Politikası | Tahakkuk',
      description:
        'Tahakkuk uygulamasının gizlilik politikası: hangi verilerin toplandığı, Google Drive bağlantısında neyin saklandığı, çerezler ve kullanıcı hakları.',
      keywords: 'gizlilik politikası, kişisel veriler, KVKK, tahakkuk',
      path: '/policy',
    });
  }
}
