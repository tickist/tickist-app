import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {Router} from '@angular/router';
import {Subject, pipe} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {TaskService} from '../../services/task.service';
import {ProjectService} from '../../services/project.service';
import {Project} from '../../models/projects';
import {ConfigurationService} from '../../services/configuration.service';
import {User} from '../../user/models';
import {UserService} from '../../services/user.service';
import {ObservableMedia} from '@angular/flex-layout';
import {MatDialog, MatDialogConfig} from '@angular/material';
import {FilterProjectDialogComponent} from '../filter-projects-dialog/filter-projects.dialog.component';
import {Filter} from '../../models/filter';
import {takeUntil} from 'rxjs/operators';
import {ProjectsFiltersService} from '../../services/projects-filters.service';
import * as _ from 'lodash';


@Component({
    selector: 'tickist-projects-list',
    templateUrl: './projects-list.component.html',
    styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    projects: Project[];
    allProjects: Project[];
    user: User;
    selectedProject: Project;
    selectedProjectsIds: Array<number> = [4];
    showOnlyProjectsWithTasks = true;
    filter: Filter;

    constructor(protected taskService: TaskService, private projectService: ProjectService,
                protected projectsFiltersService: ProjectsFiltersService,
                private route: ActivatedRoute, protected userService: UserService,
                protected configurationService: ConfigurationService, protected router: Router,
                protected media: ObservableMedia, private cd: ChangeDetectorRef, public dialog: MatDialog) {
    }

    ngOnInit() {
        this.projectService.projects$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(projects => {
            if (projects) {
                this.allProjects = projects;
                this.projects = this.generateDifferentLevelsOfProjects();
                this.cd.detectChanges();
            }
        });

        this.projectService.selectedProject$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((project) => {
            this.selectedProject = project;
            this.projects = this.generateDifferentLevelsOfProjects();
            this.cd.detectChanges();
        });

        this.projectService.selectedProjectsIds$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((ids) => {
            if (ids && ids.length > 0) {
                this.selectedProjectsIds = ids;
            }
            this.cd.detectChanges();
        });

        this.projectsFiltersService.currentProjectsFilters$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(filter => {
            this.filter = filter;
            this.projects = this.generateDifferentLevelsOfProjects();
        });

    }

    generateDifferentLevelsOfProjects() {
        let projects: Project[] = this.allProjects;

        if (this.filter) {
            projects = this.allProjects.filter(this.filter.value);
        }
        if (this.selectedProject && !projects.find(project => project.id === this.selectedProject.id)) {
            projects.push(this.allProjects.find(project => project.id === this.selectedProject.id));
        }
        projects = _.orderBy(projects,
                    ['isInbox', 'name'],
                    ['desc', 'asc']
                );

        const list_of_list = [],
            the_first_level = projects.filter((project) => project.level === 0),
            the_second_level = projects.filter((project) => project.level === 1),
            the_third_level = projects.filter((project) => project.level === 2);
        the_first_level.forEach((item_0) => {
            list_of_list.push(item_0);
            the_second_level.forEach((item_1) => {
                if (item_0.allDescendants.indexOf(item_1.id) > -1) {
                    list_of_list.push(item_1);
                    the_third_level.forEach((item_2) => {
                        if (item_1.allDescendants.indexOf(item_2.id) > -1) {
                            list_of_list.push(item_2);
                        }
                    });
                }
            });

        });
        // if we have a shared list on the second level
        the_second_level.forEach((item_1) => {
            if (list_of_list.indexOf(item_1) === -1) {
                item_1.level = 0;
                list_of_list.push(item_1);
                the_third_level.forEach((item_2) => {
                    if (item_1.allDescendants.indexOf(item_2.id) > -1) {
                        list_of_list.push(item_2);

                    }
                });
            }
        });
        // if we have the shared lists on the third level
        the_third_level.forEach((item_2) => {
            if (list_of_list.indexOf(item_2) === -1) {
                item_2.level = 0;
                list_of_list.push(item_2);
            }
        });
        return list_of_list;
    }

    toggleProjectView() {
        this.showOnlyProjectsWithTasks = !this.showOnlyProjectsWithTasks;
        this.projects = this.generateDifferentLevelsOfProjects();

    }

    trackByFn(index, item) {
        return item.id;
    }

    navigateTo(path) {
        this.router.navigate([path]);
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

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
