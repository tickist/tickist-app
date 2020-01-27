import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { NotificationsEffects } from './notifications.effects';

describe('NotificationsEffects', () => {
  let actions$: Observable<any>;
  let effects: NotificationsEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationsEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.get<NotificationsEffects>(NotificationsEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
