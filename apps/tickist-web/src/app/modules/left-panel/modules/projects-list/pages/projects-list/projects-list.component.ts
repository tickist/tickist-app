import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable, Subject} from 'rxjs';
import {TaskService} from '../../../../../../core/services/task.service';
import {Project} from '../../../../../../models/projects';
import {ConfigurationService} from '../../../../../../core/services/configuration.service';
import {User} from '../../../../../../core/models';
import {UserService} from '../../../../../../core/services/user.service';
import {MediaObserver} from '@angular/flex-layout';
import {MatDialog} from '@angular/material/dialog';
import {FilterProjectDialogComponent} from '../../components/filter-projects-dialog/filter-projects.dialog.component';
import {Filter} from '../../../../../../models/filter';
import {ProjectsFiltersService} from '../../projects-filters.service';
import {Store} from '@ngrx/store';
import {AppStore} from '../../../../../../store';
import {tasksProjectsViewRoutesName} from '../../../../../tasks-projects-view/routes.names';
import {editProjectSettingsRoutesName} from '../../../../../edit-project/routes-names';
import {selectFilteredProjectsList} from '../../projects-filters.selectors';
import {homeRoutesName} from '../../../../../../routing.module.name';


@Component({
    selector: 'tickist-projects-list',
    templateUrl: './projects-list.component.html',
    styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    user: User;
    showOnlyProjectsWithTasks = true;
    filter: Filter;
    tasksProjectsViewRoutingName: string;
    projectsList$: Observable<Project[]>;

    constructor(private taskService: TaskService,
                private projectsFiltersService: ProjectsFiltersService, private store: Store<AppStore>,
                private route: ActivatedRoute, private userService: UserService,
                private configurationService: ConfigurationService, private router: Router,
                private media: MediaObserver, private cd: ChangeDetectorRef, public dialog: MatDialog) {

        this.tasksProjectsViewRoutingName = tasksProjectsViewRoutesName.TASKS_PROJECTS_VIEW;
    }

    ngOnInit() {
        this.projectsList$ = this.store.select(selectFilteredProjectsList);
    }

    toggleProjectView() {
        this.showOnlyProjectsWithTasks = !this.showOnlyProjectsWithTasks;
    }

    trackByFn(index, item) {
        return item.id;
    }

    navigateTo(path) {
        // this.router.navigate([path]);
        this.router.navigate([homeRoutesName.HOME, {outlets: {content: [path]}}]);
        if (this.media.isActive('sm') || this.media.isActive('xs')) {
            this.configurationService.changeOpenStateLeftSidenavVisibility('close');
        }
    }

    openFilterDialog() {
        const dialogRef = this.dialog.open(FilterProjectDialogComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result) {

            }
        });
    }

    navigateToCreateProjectView() {
        this.router.navigate(['home', {outlets: {content: [editProjectSettingsRoutesName.EDIT_PROJECT]}}]);
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.cd.detach();
    }

}
