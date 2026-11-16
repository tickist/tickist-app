import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

let nextSheetId = 0;

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
  private readonly instanceId = nextSheetId++;

  readonly tabChange = output<string>();
  readonly panelClose = output<void>();

  selectTab(tabKey: string): void {
    this.tabChange.emit(tabKey);
  }

  tabId(tabKey: string): string {
    return `sheet-${this.instanceId}-tab-${tabKey}`;
  }

  // Tabs are one Tab stop; arrow keys (both axes, since the list is vertical
  // on wide screens and horizontal on narrow ones), Home and End move between
  // them. Selection follows focus because switching panels is instant.
  onTabKeydown(event: KeyboardEvent): void {
    const tabs = this.tabs();
    const current = tabs.findIndex((tab) => tab.key === this.activeTab());
    let next: number;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = (current + 1) % tabs.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = (current - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tabs.length - 1;
        break;
      default:
        return;
    }

    const tab = tabs[next];

    if (!tab) return;
    event.preventDefault();
    this.selectTab(tab.key);

    const list =
      event.currentTarget instanceof HTMLElement
        ? event.currentTarget.parentElement
        : null;

    list?.querySelector<HTMLElement>(`#${this.tabId(tab.key)}`)?.focus();
  }

  requestClose(): void {
    this.panelClose.emit();
  }
}
