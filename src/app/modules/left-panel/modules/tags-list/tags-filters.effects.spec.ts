import { TestBed, inject } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { TagsFiltersEffects } from './tags-filters.effects';

describe('TagsFiltersEffects', () => {
  let actions$: Observable<any>;
  let effects: TagsFiltersEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TagsFiltersEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.get(TagsFiltersEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
