import { Injectable, inject, signal } from '@angular/core';

import {
  type DayOrders,
  moveInDayOrder,
  readDayOrders,
  writeDayOrders,
} from '../core/time/day-order';
import { zonedDateKey } from '../core/time/zoned-time';
import { TimeTrackingService } from './time-tracking.service';

/**
 * The manual order of tasks for each day, shared by the Weekdays view and the
 * dashboard Today group. Kept in this browser's local storage.
 */
@Injectable({ providedIn: 'root' })
export class DayPlanService {
  private readonly timeTracking = inject(TimeTrackingService);
  private readonly orders = signal<DayOrders>(readDayOrders(browserStorage()));

  /** Calendar day in the account timezone, as YYYY-MM-DD. */
  todayKey(): string {
    return zonedDateKey(new Date(), this.timeTracking.timezone());
  }

  orderFor(dayKey: string): readonly string[] | undefined {
    return this.orders()[dayKey];
  }

  hasOrder(dayKey: string): boolean {
    return (this.orders()[dayKey]?.length ?? 0) > 0;
  }

  move(
    dayKey: string,
    visibleIds: readonly string[],
    fromIndex: number,
    toIndex: number
  ): void {
    if (fromIndex === toIndex) return;

    this.save({
      ...this.orders(),
      [dayKey]: moveInDayOrder(
        this.orders()[dayKey],
        visibleIds,
        fromIndex,
        toIndex
      ),
    });
  }

  reset(dayKey: string): void {
    const { [dayKey]: _removed, ...rest } = this.orders();

    this.save(rest);
  }

  private save(next: DayOrders): void {
    this.orders.set(writeDayOrders(browserStorage(), next, this.todayKey()));
  }
}

function browserStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
