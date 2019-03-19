import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable} from 'rxjs';

import {TagsFiltersEffects} from './tags-filters.effects';
import {StoreModule} from '@ngrx/store';

describe('TagsFiltersEffects', () => {
    let actions$: Observable<any>;
    let effects: TagsFiltersEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
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
