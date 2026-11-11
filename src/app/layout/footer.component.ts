import { ChangeDetectionStrategy, Component } from '@angular/core';
import { APP_VERSION } from '../core/app-info';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  readonly version = APP_VERSION;
  readonly year = new Date().getFullYear();
}
