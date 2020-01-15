import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {selectTeam} from '../../../../core/selectors/team.selectors';
import {select, Store} from '@ngrx/store';
import {AppStore} from '../../../../store';
import {HideAddTaskButton, ShowAddTaskButton} from '../../../../core/actions/add-task-button-visibility.actions';
import {ShareWithUser} from '@data/projects';

@Component({
    selector: 'tickist-team',
    templateUrl: './team.component.html',
    styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit, OnDestroy {
    team$: Observable<(ShareWithUser)[]>;

    constructor(private store: Store<{}>) {
    }

    ngOnInit() {
        this.team$ = this.store.pipe(
            select(selectTeam));
        this.store.dispatch(new HideAddTaskButton());
    }

    ngOnDestroy(): void {
        this.store.dispatch(new ShowAddTaskButton());
    }

}
