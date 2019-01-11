import {
    Component, OnInit, Input, OnDestroy, ChangeDetectionStrategy, OnChanges, SimpleChange, HostListener
} from '@angular/core';
import {Project} from '../../models/projects';
import {ProjectService} from '../../services/project.service';
import {Router} from '@angular/router';
import {ConfigurationService} from '../../services/configuration.service';

import {ObservableMedia} from '@angular/flex-layout';
import {DeleteProjectConfirmationDialogComponent} from '../delete-project-dialog/delete-project-dialog.component';
import {MatDialog} from '@angular/material';
import {UserService} from '../../services/user.service';
import {User} from '../../models/user';

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
export class SingleProjectComponent implements OnInit, OnDestroy, OnChanges {

    private t: Timer;
    @Input() project: Project;
    @Input() isSmallScreen: boolean;
    @Input() selectedProjectsIds: Array<number>;
    @Input() selectedProject: Project;
    isActive = false;
    activeCheckboxMode = false;
    isSelected = false;
    isMenuVisible = false;
    isFastMenuVisible = false;
    isMouseOver = false;
    deleteOrLeave = '';
    user: User;

    constructor(private projectService: ProjectService, protected router: Router, public dialog: MatDialog,
                protected configurationService: ConfigurationService, protected media: ObservableMedia,
                protected userService: UserService) {
    }

    ngOnInit() {
        this.deleteOrLeave = this.project.shareWith.length > 1 ? 'Leave' : 'Delete';
        this.userService.user$.subscribe(user => {
            this.user = user;
        });
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        // console.log(this.isActive);
        this.isActive = this.selectedProjectsIds && this.selectedProjectsIds.indexOf(this.project.id) > -1;

        if (this.selectedProject && this.selectedProject.allDescendants.indexOf(this.project.id) > -1) {
            this.isSelected = true;
            if (this.selectedProject.allDescendants.length > 1) {
                this.activeCheckboxMode = true;
            }
        } else {
            this.isSelected = false;
            this.activeCheckboxMode = false;
        }
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
    }

    changeId() {
        if (this.isActive) {
            this.projectService.updateElementFromSelectedProjectsIds(this.project.id);
        } else {
            this.projectService.deleteElementFromSelectedProjectsIds(this.project.id);
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
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.projectService.deleteProject(this.project);
                this.router.navigate(['/home/projects', this.user.inboxPk]);
            }
        });

    }

    navigateTo(path, projectId, $event) {
        const elementClickPath = $event.path;
        const mdCheckbox = elementClickPath.find(elem => elem.localName === 'mat-checkbox');
        if (!mdCheckbox) {
            this.router.navigate([path, projectId]);
            if (this.media.isActive('sm') || this.media.isActive('xs')) {
                this.configurationService.changeOpenStateLeftSidenavVisibility('close');
            }
        }
    }

}
