import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {Router} from '@angular/router';
import {Subject, pipe, Observable} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {TaskService} from '../../../../../../core/services/task.service';
import {Project} from '../../../../../../models/projects';
import {ConfigurationService} from '../../../../../../services/configuration.service';
import {User} from '../../../../../../core/models';
import {UserService} from '../../../../../../core/services/user.service';
import {MediaObserver} from '@angular/flex-layout';
import {MatDialog} from '@angular/material';
import {FilterProjectDialogComponent} from '../../components/filter-projects-dialog/filter-projects.dialog.component';
import {Filter} from '../../../../../../models/filter';
import {takeUntil} from 'rxjs/operators';
import {ProjectsFiltersService} from '../../projects-filters.service';
import * as _ from 'lodash';
import {Store} from '@ngrx/store';
import {AppStore} from '../../../../../../store';
import {selectActiveProject, selectActiveProjectsIds, selectAllProjects} from '../../../../../../core/selectors/projects.selectors';
import {tasksProjectsViewRoutesName} from '../../../../../tasks-projects-view/routes.names';
import {homeRoutesName} from '../../../../../../routing.module';
import {tasksTagsViewRoutesName} from '../../../../../tasks-tags-view/routes.names';
import {dashboardRoutesName} from '../../../../../dashboard/routes.names';
import {editProjectSettingsRoutesName} from '../../../../../edit-project/routes-names';
import {selectFilteredProjectsList} from '../../projects-filters.selectors';


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
        this.projectsList$.subscribe((projects) => {
            console.log(projects)
        })
    }

    // generateDifferentLevelsOfProjects() {
    //     let projects: Project[] = this.allProjects;
    //
    //     if (this.filter) {
    //         projects = this.allProjects.filter(<any>this.filter.value);
    //     }
    //     if (this.selectedProject && !projects.find(project => project.id === this.selectedProject.id)) {
    //         projects.push(this.allProjects.find(project => project.id === this.selectedProject.id));
    //     }
    //     projects = _.orderBy(projects,
    //         ['isInbox', 'name'],
    //         ['desc', 'asc']
    //     );
    //
    //     const list_of_list = [],
    //         the_first_level = projects.filter((project) => project.level === 0),
    //         the_second_level = projects.filter((project) => project.level === 1),
    //         the_third_level = projects.filter((project) => project.level === 2);
    //     the_first_level.forEach((item_0) => {
    //         list_of_list.push(item_0);
    //         the_second_level.forEach((item_1) => {
    //             if (item_0.allDescendants.indexOf(item_1.id) > -1) {
    //                 list_of_list.push(item_1);
    //                 the_third_level.forEach((item_2) => {
    //                     if (item_1.allDescendants.indexOf(item_2.id) > -1) {
    //                         list_of_list.push(item_2);
    //                     }
    //                 });
    //             }
    //         });
    //
    //     });
    //     // if we have a shared list on the second level
    //     the_second_level.forEach((item_1) => {
    //         if (list_of_list.indexOf(item_1) === -1) {
    //             item_1.level = 0;
    //             list_of_list.push(item_1);
    //             the_third_level.forEach((item_2) => {
    //                 if (item_1.allDescendants.indexOf(item_2.id) > -1) {
    //                     list_of_list.push(item_2);
    //
    //                 }
    //             });
    //         }
    //     });
    //     // if we have the shared lists on the third level
    //     the_third_level.forEach((item_2) => {
    //         if (list_of_list.indexOf(item_2) === -1) {
    //             item_2.level = 0;
    //             list_of_list.push(item_2);
    //         }
    //     });
    //     return list_of_list;
    // }

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
