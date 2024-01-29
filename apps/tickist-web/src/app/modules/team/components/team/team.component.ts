import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {selectTeam} from '../../../../core/selectors/team.selectors';
import {select, Store} from '@ngrx/store';
import {ShareWithUser} from '@data/projects';
import {hideAddTaskButton, showAddTaskButton} from "../../../../core/actions/add-task-button-visibility.actions";
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';
import { NgFor, AsyncPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { FlexModule } from '@ngbracket/ngx-layout/flex';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'tickist-team',
    templateUrl: './team.component.html',
    styleUrls: ['./team.component.scss'],
    standalone: true,
    imports: [MatCardModule, FlexModule, MatListModule, NgFor, UserAvatarComponent, AsyncPipe]
})
export class TeamComponent implements OnInit, OnDestroy {
    team$: Observable<(ShareWithUser)[]>;

    constructor(private store: Store) {
    }

    ngOnInit() {
        this.team$ = this.store.pipe(
            select(selectTeam));
        this.store.dispatch(hideAddTaskButton());
    }

    ngOnDestroy(): void {
        this.store.dispatch(showAddTaskButton());
    }

}
