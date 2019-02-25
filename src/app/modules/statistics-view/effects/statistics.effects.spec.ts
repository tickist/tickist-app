import { TestBed, inject } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { Statistics.EffectEffects } from './statistics-view.effect.effects';

describe('Statistics.EffectEffects', () => {
  let actions$: Observable<any>;
  let effects: Statistics.EffectEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Statistics.EffectEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.get(Statistics.EffectEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
