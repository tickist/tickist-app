import { NativeDateAdapter } from '@angular/material/core';


export class MyDateAdapter extends NativeDateAdapter {
  getFirstDayOfWeek(): number {
    return 1;
  }

  // Implementation for remaining abstract methods of DateAdapter.
}
