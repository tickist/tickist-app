import {Component, OnDestroy, OnInit} from '@angular/core';
import {ProjectService} from '../../../../core/services/project.service';
import {SimpleUser} from '@data/users/models';
import {ConfigurationService} from '../../../../core/services/configuration.service';
import {environment} from '../../../../../environments/environment';
import {Observable, Subject} from 'rxjs';
import {selectTeam} from '../../../../core/selectors/team.selectors';
import {select, Store} from '@ngrx/store';
import {AppStore} from '../../../../store';
import {HideAddTaskButton, ShowAddTaskButton} from '../../../../core/actions/add-task-button-visibility.actions';
import {ShareWithPendingUser, ShareWithUser} from '@data/projects';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'tickist-team',
    templateUrl: './team.component.html',
    styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit, OnDestroy {
    team$: Observable<(ShareWithUser | ShareWithPendingUser)[]>;
    staticUrl: string;

    constructor(private store: Store<AppStore>) {
    }

    ngOnInit() {
        this.staticUrl = environment['staticUrl'];
        this.team$ = this.store.pipe(
            select(selectTeam));
        this.store.dispatch(new HideAddTaskButton());
    }

    ngOnDestroy(): void {
        this.store.dispatch(new ShowAddTaskButton());
    }

}
