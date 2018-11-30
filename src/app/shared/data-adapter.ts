import {NativeDateAdapter} from '@angular/material';


export class MyDateAdapter extends NativeDateAdapter {
  getFirstDayOfWeek(): number {
    return 1;
  }

  // Implementation for remaining abstract methods of DateAdapter.
}
