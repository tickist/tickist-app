import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaUpdateService } from './core/pwa/pwa-update.service';
import { ToastContainerComponent } from './core/ui/toast-container.component';
import { AnalyticsConsentComponent } from './core/privacy/analytics-consent.component';

@Component({
  imports: [RouterOutlet, ToastContainerComponent, AnalyticsConsentComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css',
})
export class App {
  private readonly pwaUpdates = inject(PwaUpdateService);

  constructor() {
    this.pwaUpdates.start();
  }
}
