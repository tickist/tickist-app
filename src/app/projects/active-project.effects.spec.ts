import { TestBed, inject } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { ActiveProjecEffects } from './active-project.effects';

describe('ActiveProjecEffects', () => {
  let actions$: Observable<any>;
  let effects: ActiveProjecEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ActiveProjecEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.get(ActiveProjecEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
