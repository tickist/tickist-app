import { TestBed, inject } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { AssignedToFiltersTasksEffects } from './assigned-to-filters-tasks.effects';

describe('AssignedToFiltersTasksEffects', () => {
  let actions$: Observable<any>;
  let effects: AssignedToFiltersTasksEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AssignedToFiltersTasksEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.get(AssignedToFiltersTasksEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
