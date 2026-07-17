import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaUpdateService } from './core/pwa/pwa-update.service';
import { ToastContainerComponent } from './core/ui/toast-container.component';

@Component({
  imports: [RouterOutlet, ToastContainerComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly pwaUpdates = inject(PwaUpdateService);

  constructor() {
    this.pwaUpdates.start();
  }
}
