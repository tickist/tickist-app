import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

/** Switch between full task cards and a compact list of names. */
@Component({
  selector: 'app-simple-view-toggle',
  standalone: true,
  template: `
    <label class="simple-toggle" title="Hide task details on the cards">
      <input
        type="checkbox"
        data-testid="simple-view-toggle"
        [checked]="checked()"
        (change)="changed.emit($any($event.target).checked)"
      />
      <span class="toggle-pill"></span>
      <span class="simple-toggle__label">Simple view</span>
    </label>
  `,
  styleUrl: './simple-view-toggle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleViewToggleComponent {
  readonly checked = input(false);
  readonly changed = output<boolean>();
}
