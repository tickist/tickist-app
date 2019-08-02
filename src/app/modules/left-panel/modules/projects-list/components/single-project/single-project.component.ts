import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Input, OnDestroy, OnInit} from '@angular/core';
import {Project} from '../../../../../../models/projects';
import {ProjectService} from '../../../../../../core/services/project.service';
import {Router} from '@angular/router';
import {ConfigurationService} from '../../../../../../services/configuration.service';

import {MediaObserver} from '@angular/flex-layout';
import {DeleteProjectConfirmationDialogComponent} from '../delete-project-dialog/delete-project-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {User} from '../../../../../../core/models';
import {AddNewActiveProjectId, DeleteActiveProjectId} from '../../../../../../core/actions/projects/active-projects-ids.actions';
import {AppStore} from '../../../../../../store';
import {Store} from '@ngrx/store';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {tasksProjectsViewRoutesName} from '../../../../../tasks-projects-view/routes.names';
import {editProjectSettingsRoutesName} from '../../../../../edit-project/routes-names';
import {selectActiveProject, selectActiveProjectsIds} from '../../../../../../core/selectors/projects.selectors';
import {selectLoggedInUser} from '../../../../../../core/selectors/user.selectors';
import {DeleteProject, RequestDeleteProject} from '../../../../../../core/actions/projects/projects.actions';
import {homeRoutesName} from '../../../../../../routing.module.name';


class Timer {
    readonly start = performance.now();

    constructor(private readonly name: string) {
    }

    stop() {
        const time = performance.now() - this.start;
        // console.log('Timer:', this.name, 'finished in', Math.round(time), 'ms');
    }
}


@Component({
    selector: 'single-project',
    templateUrl: './single-project.component.html',
    styleUrls: ['./single-project.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleProjectComponent implements OnInit, OnDestroy {

    private ngUnsubscribe: Subject<void> = new Subject<void>();
    @Input() project: Project;
    @Input() isSmallScreen: boolean;
    selectedProject$: Observable<Project>;
    selectedProjectsIds$: Observable<Array<Number| string>>;
    isActive = false;
    activeCheckboxMode = false;
    isSelected = false;
    isMenuVisible = false;
    isFastMenuVisible = false;
    isMouseOver = false;
    deleteOrLeave = '';
    user: User;


    constructor(private projectService: ProjectService, protected router: Router, public dialog: MatDialog,
                protected configurationService: ConfigurationService, protected media: MediaObserver,
                private store: Store<AppStore>, private cd: ChangeDetectorRef) {

    }

    ngOnInit() {
        this.deleteOrLeave = this.project.shareWith.length > 1 ? 'Leave' : 'Delete';
        this.store.select(selectLoggedInUser)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(user => {
                this.user = user;
            });
        this.selectedProject$ = this.store.select(selectActiveProject);
        this.selectedProject$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(project => {
                if (project && project.allDescendants.indexOf(this.project.id) > -1) {
                    this.isSelected = true;
                    if (project.allDescendants.length > 1) {
                        this.activeCheckboxMode = true;
                    }
                } else {
                    this.isSelected = false;
                    this.activeCheckboxMode = false;
                }
                this.cd.detectChanges();
            });
        this.selectedProjectsIds$ = this.store.select(selectActiveProjectsIds);
        this.selectedProjectsIds$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((ids) => {
                this.isActive = ids && ids.indexOf(this.project.id) > -1;
                this.cd.detectChanges();
            });

    }

    @HostListener('mouseenter')
    onMouseEnter() {
        this.isMouseOver = true;
        this.changeMenuVisiblity();
        this.isMenuVisible = true;
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        this.isMouseOver = false;
        this.changeMenuVisiblity();
        if (!this.isFastMenuVisible) {
            this.isMenuVisible = false;
        }

    }

    changeMenuVisiblity() {
        if (this.isMouseOver) {
            this.isMenuVisible = true;
        }
        if (!this.isMouseOver && this.isFastMenuVisible) {
            this.isMenuVisible = true;
        }
        if (!this.isMouseOver && !this.isFastMenuVisible) {
            this.isMenuVisible = false;
        }
    }

    changeFastMenuVisible(value) {
        this.isFastMenuVisible = value;
        this.changeMenuVisiblity();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    changeId() {
        if (this.isActive) {
            this.store.dispatch(new AddNewActiveProjectId({projectId: this.project.id}));

        } else {
            this.store.dispatch(new DeleteActiveProjectId({projectId: this.project.id}));

        }
    }

    deleteOrLeaveProject() {
        let content;
        let title;
        if (this.user.id === this.project.owner) {
            title = 'Delete project';
            if (this.project.shareWith.length > 1) {
                content = `If you are sure you want to delete the shared project
                ${this.project.name}, click Yes. All tasks assigned to you will
                be deleted and tasks assigned to others will be moved to their Inbox folder.`;
            } else {
                content = `If you are sure you want to delete the project ${this.project.name} and all tasks from this project, click Yes.`;
            }
        } else {
            title = 'Delete project';
            content = `If you are sure you want to leave the shared project ${this.project.name} click Continue.
                        All tasks assigned to you will be deleted.`;
        }

        const dialogRef = this.dialog.open(DeleteProjectConfirmationDialogComponent);
        dialogRef.componentInstance.setTitle(title);
        dialogRef.componentInstance.setContent(content);
        dialogRef.afterClosed().pipe(takeUntil(this.ngUnsubscribe)).subscribe(result => {
            if (result) {
                this.store.dispatch(new RequestDeleteProject({projectId: this.project.id}));
                this.router.navigate(['home', {outlets: {content: [tasksProjectsViewRoutesName.TASKS_PROJECTS_VIEW, this.user.inboxPk]}}]);
            }
        });

    }

    navigateToEditProjectView(projectId: string) {
        this.router.navigate([homeRoutesName.HOME, {outlets: {content: [editProjectSettingsRoutesName.EDIT_PROJECT, projectId]}}]);
    }

    navigateTo(path, projectId, $event) {
        const elementClickPath = $event.path;
        const mdCheckbox = elementClickPath.find(elem => elem.localName === 'mat-checkbox');
        if (!mdCheckbox) {
            this.router.navigate(['home', {outlets: {content: [tasksProjectsViewRoutesName.TASKS_PROJECTS_VIEW, projectId]}}]).catch((err => console.log(err)));
            if (this.media.isActive('sm') || this.media.isActive('xs')) {
                this.configurationService.changeOpenStateLeftSidenavVisibility('close');
            }
        }
    }

}
