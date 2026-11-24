import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
}
