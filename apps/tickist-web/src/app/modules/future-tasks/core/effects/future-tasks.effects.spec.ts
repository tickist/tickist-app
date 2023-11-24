import { TestBed } from "@angular/core/testing";
import { provideMockActions } from "@ngrx/effects/testing";
import { Observable, ReplaySubject } from "rxjs";

import { FutureTasksEffects } from "./future-tasks.effects";
import { StoreModule } from "@ngrx/store";

describe("FutureTasksEffects", () => {
    let actions$: Observable<any>;
    let effects: FutureTasksEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [FutureTasksEffects, provideMockActions(() => actions$)],
        });

        effects = TestBed.get(FutureTasksEffects);
        actions$ = new ReplaySubject(1);
    });

    it("should be created", () => {
        expect(effects).toBeTruthy();
    });
});
