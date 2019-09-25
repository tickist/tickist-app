import {Component, OnDestroy, OnInit} from '@angular/core';
import {ProjectService} from '../../../../core/services/project.service';
import {SimpleUser} from '@data/users/models';
import {ConfigurationService} from '../../../../core/services/configuration.service';
import {environment} from '../../../../../environments/environment';
import {Observable} from 'rxjs';
import {selectTeam} from '../../../../core/selectors/team.selectors';
import {Store} from '@ngrx/store';
import {AppStore} from '../../../../store';
import {HideAddTaskButton, ShowAddTaskButton} from '../../../../core/actions/add-task-button-visibility.actions';

@Component({
    selector: 'tickist-team',
    templateUrl: './team.component.html',
    styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit, OnDestroy {
    team$: Observable<SimpleUser[]>;
    staticUrl: string;

    constructor(private store: Store<AppStore>) {
    }

    ngOnInit() {
        this.staticUrl = environment['staticUrl'];
        this.team$ = this.store.select(selectTeam);
        this.store.dispatch(new HideAddTaskButton());
    }

    ngOnDestroy(): void {
        this.store.dispatch(new ShowAddTaskButton());
    }

}
