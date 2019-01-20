import { TestBed, inject } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { TasksFiltersEffects } from './tasks-filters.effects';

describe('TasksFiltersEffects', () => {
  let actions$: Observable<any>;
  let effects: TasksFiltersEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TasksFiltersEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.get(TasksFiltersEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
