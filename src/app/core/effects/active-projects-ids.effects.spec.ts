import { TestBed, inject } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { ActiveProjectsIdsEffects } from './active-projects-ids.effects';

describe('ActiveProjectsIdsEffects', () => {
  let actions$: Observable<any>;
  let effects: ActiveProjectsIdsEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ActiveProjectsIdsEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.get(ActiveProjectsIdsEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
