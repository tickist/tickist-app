import { Component, OnDestroy, OnInit } from "@angular/core";
import { tasksTreeViewRoutesName } from "../../../tasks-tree-view/routes.names";
import { statisticsRoutesName } from "../../../statistics-view/routes.names";
import { Router, RouterLink } from "@angular/router";
import { tasksTagsViewRoutesName } from "../../../tasks-tags-view/routes.names";
import { homeRoutesName } from "../../../../routing.module.name";
import { ProjectType, User } from "@data";
import { Store } from "@ngrx/store";
import { Observable, Subject } from "rxjs";
import { selectLoggedInUser } from "../../../../core/selectors/user.selectors";
import { filter, takeUntil } from "rxjs/operators";
import { tasksProjectsViewRoutesName } from "../../../tasks-projects-view/routes.names";
import { selectInboxTasksCounter } from "../../../../core/selectors/task.selectors";
import { selectProjectTypeCounter } from "../../../../core/selectors/projects.selectors";
import { dashboardRoutesName } from "../../../dashboard/routes.names";
import { AsyncPipe } from "@angular/common";
import { FeatureFlagDirective } from "../../../../shared/directives/feature-flag.directive";
import { TagsListComponent } from "../../../tags-list/pages/tags-list/tags-list.component";
import { ProjectsListComponent } from "../../../projects-list/pages/projects-list/projects-list.component";
import { FutureListComponent } from "../../components/future-list/future-list.component";
import { WeekDaysComponent } from "../../components/weekdays/weekdays.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatCardModule } from "@angular/material/card";

@Component({
    selector: "tickist-left-panel",
    templateUrl: "./left-panel.component.html",
    styleUrls: ["./left-panel.component.scss"],
    standalone: true,
    imports: [
        MatCardModule,
        MatExpansionModule,
        RouterLink,
        FaIconComponent,
        WeekDaysComponent,
        FutureListComponent,
        ProjectsListComponent,
        TagsListComponent,
        FeatureFlagDirective,
        AsyncPipe,
    ],
})
export class LeftPanelComponent implements OnInit, OnDestroy {
    projectsTypes = ProjectType;
    user: User;
    inboxPk: string;
    activeProjectCounter$: Observable<number>;
    maybeProjectCounter$: Observable<number>;
    remiderProjectCounter$: Observable<number>;
    inboxTasksCounter$: Observable<number>;
    home = "/" + homeRoutesName.home;
    dashboard = dashboardRoutesName.dashboard;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private router: Router, private store: Store) {}

    ngOnInit() {
        this.store
            .select(selectLoggedInUser)
            .pipe(
                filter((user) => !!user),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((user) => {
                console.log({ user });
                this.inboxPk = user.inboxPk;
            });
        this.inboxTasksCounter$ = this.store.select(selectInboxTasksCounter);
        this.activeProjectCounter$ = this.store.select(selectProjectTypeCounter(ProjectType.active));
        this.maybeProjectCounter$ = this.store.select(selectProjectTypeCounter(ProjectType.maybe));
        this.remiderProjectCounter$ = this.store.select(selectProjectTypeCounter(ProjectType.routineReminder));
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    navigateToTags() {
        this.router.navigate([homeRoutesName.home, tasksTagsViewRoutesName.tasksTagsView]);
    }

    navigateToInbox() {
        this.router.navigate([homeRoutesName.home, tasksProjectsViewRoutesName.tasksProjectsView, this.inboxPk]);
    }

    navigateToTasksTreeView() {
        this.router.navigate([homeRoutesName.home, tasksTreeViewRoutesName.tasksTreeView]);
    }

    navigateToStatisticsView() {
        this.router.navigate([homeRoutesName.home, statisticsRoutesName.statistics]);
    }
}
