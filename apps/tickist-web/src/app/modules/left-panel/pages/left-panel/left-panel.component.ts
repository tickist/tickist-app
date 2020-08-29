import {Component, OnDestroy, OnInit} from '@angular/core';
import {tasksTreeViewRoutesName} from '../../../tasks-tree-view/routes.names';
import {statisticsRoutesName} from '../../../statistics-view/routes.names';
import {Router} from '@angular/router';
import {tasksTagsViewRoutesName} from '../../../tasks-tags-view/routes.names';
import {homeRoutesName} from '../../../../routing.module.name';
import {ProjectType, User} from "@data";
import {Store} from "@ngrx/store";
import {Observable, Subject} from "rxjs";
import {selectLoggedInUser} from "../../../../core/selectors/user.selectors";
import {filter, takeUntil} from "rxjs/operators";
import {tasksProjectsViewRoutesName} from "../../../tasks-projects-view/routes.names";
import {selectInboxTasksCounter} from "../../../../core/selectors/task.selectors";
import {selectProjectTypeCounter} from "../../../../core/selectors/projects.selectors";
import {dashboardRoutesName} from "../../../dashboard/routes.names";


@Component({
    selector: 'tickist-left-panel',
    templateUrl: './left-panel.component.html',
    styleUrls: ['./left-panel.component.scss']
})
export class LeftPanelComponent implements OnInit, OnDestroy {
    projectsTypes = ProjectType;
    user: User;
    inboxPk: string
    activeProjectCounter$: Observable<number>;
    maybeProjectCounter$: Observable<number>
    remiderProjectCounter$: Observable<number>;
    inboxTasksCounter$: Observable<number>;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    home = "/" + homeRoutesName.HOME;
    dashboard = dashboardRoutesName.DASHBOARD;

    constructor(private router: Router, private store: Store) {
    }

    ngOnInit() {
        this.store.select(selectLoggedInUser).pipe(
            filter(user => !!user),
            takeUntil(this.ngUnsubscribe)
        ).subscribe(user => {
            this.inboxPk = user.inboxPk
        })
        this.inboxTasksCounter$ = this.store.select(selectInboxTasksCounter)
        this.activeProjectCounter$ = this.store.select(selectProjectTypeCounter(ProjectType.ALIVE))
        this.maybeProjectCounter$ = this.store.select(selectProjectTypeCounter(ProjectType.MAYBE))
        this.remiderProjectCounter$ = this.store.select(selectProjectTypeCounter(ProjectType.ROUTINE_REMINDER))
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    navigateToTags() {
        this.router.navigate([homeRoutesName.HOME, tasksTagsViewRoutesName.TASKS_TAGS_VIEW]);
    }

    navigateToInbox() {
        this.router.navigate([homeRoutesName.HOME, tasksProjectsViewRoutesName.TASKS_PROJECTS_VIEW, this.inboxPk]);
    }

    navigateToTasksTreeView() {
        this.router.navigate([homeRoutesName.HOME, tasksTreeViewRoutesName.TASKS_TREE_VIEW]);
    }

    navigateToStatisticsView() {
        this.router.navigate([homeRoutesName.HOME, statisticsRoutesName.STATISTICS]);
    }
}
