import {TestBed, inject} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable, ReplaySubject} from 'rxjs';

import {TeamEffects} from './team.effects';
import {StoreModule} from '@ngrx/store';
import {UserService} from '../services/user.service';
import {HttpClientModule} from '@angular/common/http';
import {TickistMaterialModule} from '../../material.module';
import {TasksFiltersService} from '../services/tasks-filters.service';

class UserServiceMock {
}

class TasksFiltersServiceMock {
}


describe('TeamEffects', () => {
    let actions$: Observable<any>;
    let effects: TeamEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                StoreModule.forRoot({}),
                HttpClientModule,
                TickistMaterialModule
            ],
            providers: [
                TeamEffects,
                {provide: UserService, useClass: UserServiceMock},
                {provide: TasksFiltersService, useClass: TasksFiltersServiceMock},
                provideMockActions(() => actions$)
            ]
        });

        effects = TestBed.get(TeamEffects);
        actions$ = new ReplaySubject(1);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });
});
