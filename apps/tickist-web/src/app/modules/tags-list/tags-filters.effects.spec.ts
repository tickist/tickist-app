import { TestBed } from "@angular/core/testing";
import { provideMockActions } from "@ngrx/effects/testing";
import { Observable, ReplaySubject } from "rxjs";

import { TagsFiltersEffects } from "./tags-filters.effects";
import { StoreModule } from "@ngrx/store";

describe("TagsFiltersEffects", () => {
    let actions$: Observable<any>;
    let effects: TagsFiltersEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [TagsFiltersEffects, provideMockActions(() => actions$)],
        });

        effects = TestBed.get(TagsFiltersEffects);
        actions$ = new ReplaySubject(1);
    });

    it("should be created", () => {
        expect(effects).toBeTruthy();
    });
});
