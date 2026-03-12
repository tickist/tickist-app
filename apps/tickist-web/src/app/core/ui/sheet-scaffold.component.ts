import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export interface SheetScaffoldTab<Key extends string = string> {
  key: Key;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-sheet-scaffold',
  imports: [],
  templateUrl: './sheet-scaffold.component.html',
  styleUrl: './sheet-scaffold.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheetScaffoldComponent {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly tabs = input<readonly SheetScaffoldTab[]>([]);
  readonly activeTab = input<string | null>(null);
  readonly testId = input<string | null>(null);
  readonly closeAriaLabel = input('Close panel');

  readonly hasTabs = computed(() => this.tabs().length > 0);

  readonly tabChange = output<string>();
  readonly panelClose = output<void>();

  selectTab(tabKey: string): void {
    this.tabChange.emit(tabKey);
  }

  requestClose(): void {
    this.panelClose.emit();
  }
}
