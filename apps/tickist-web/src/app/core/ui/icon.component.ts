import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import {
  lucideAlarmClock,
  lucideArrowUpDown,
  lucideBell,
  lucideCalendarCheck,
  lucideCalendarDays,
  lucideCalendarRange,
  lucideChartColumn,
  lucideArrowDown,
  lucideArrowUp,
  lucideCheck,
  lucideChevronDown,
  lucideCopy,
  lucideDatabaseBackup,
  lucideFlag,
  lucideFolder,
  lucideFolderKanban,
  lucideFolderOpen,
  lucideFunnel,
  lucideHandshake,
  lucideHistory,
  lucideHouse,
  lucideInfo,
  lucideKeyRound,
  lucideLightbulb,
  lucideListChecks,
  lucideLock,
  lucideMenu,
  lucideMessageSquareText,
  lucideMoon,
  lucideNetwork,
  lucidePalette,
  lucidePause,
  lucidePencil,
  lucidePin,
  lucidePlay,
  lucideRefreshCw,
  lucideRepeat,
  lucideSearch,
  lucideSettings,
  lucideSparkles,
  lucideSquare,
  lucideSun,
  lucideTag,
  lucideTarget,
  lucideTimer,
  lucideTrash2,
  lucideTriangleAlert,
  lucideUser,
  lucideX,
  lucideZap,
} from '@ng-icons/lucide';

/**
 * Interface icons, one line style for the whole app. Keys describe what
 * the icon means in Tickist, not what it depicts.
 */
const UI_ICONS = {
  dashboard: lucideHouse,
  'active-projects': lucideFolderOpen,
  someday: lucideLightbulb,
  routine: lucideRefreshCw,
  weekdays: lucideCalendarDays,
  future: lucideCalendarRange,
  tree: lucideNetwork,
  tag: lucideTag,
  time: lucideTimer,
  statistics: lucideChartColumn,
  play: lucidePlay,
  pause: lucidePause,
  pin: lucidePin,
  edit: lucidePencil,
  delete: lucideTrash2,
  project: lucideFolder,
  description: lucideMessageSquareText,
  repeat: lucideRepeat,
  reminder: lucideAlarmClock,
  steps: lucideListChecks,
  deadline: lucideFlag,
  scheduled: lucideCalendarCheck,
  'task-normal': lucideSquare,
  'next-action': lucideZap,
  'need-info': lucideInfo,
  sun: lucideSun,
  moon: lucideMoon,
  menu: lucideMenu,
  sort: lucideArrowUpDown,
  search: lucideSearch,
  filter: lucideFunnel,
  copy: lucideCopy,
  check: lucideCheck,
  'chevron-down': lucideChevronDown,
  'move-up': lucideArrowUp,
  'move-down': lucideArrowDown,
  close: lucideX,
  warning: lucideTriangleAlert,
  target: lucideTarget,
  account: lucideUser,
  workspaces: lucideFolderKanban,
  password: lucideLock,
  notifications: lucideBell,
  backup: lucideDatabaseBackup,
  'api-tokens': lucideKeyRound,
  settings: lucideSettings,
  sharing: lucideHandshake,
  branding: lucidePalette,
  extra: lucideSparkles,
  history: lucideHistory,
} satisfies Record<string, string>;

export type UiIconName = keyof typeof UI_ICONS;

/** `<app-icon name="pin" />`: a decorative 1em line icon by default. */
@Component({
  selector: 'app-icon',
  imports: [NgIcon],
  template: `<ng-icon
    [svg]="svg()"
    [size]="size()"
    [strokeWidth]="strokeWidth()"
    aria-hidden="true"
  ></ng-icon>`,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class IconComponent {
  readonly name = input.required<UiIconName>();
  readonly size = input('1.1em');
  readonly strokeWidth = input(2);

  svg(): string {
    return UI_ICONS[this.name()];
  }
}
