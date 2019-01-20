import {
    Component, OnInit, Input, OnDestroy, OnChanges, SimpleChange, ChangeDetectionStrategy,
    AfterViewInit, ElementRef, ViewChild, Renderer2, HostListener
} from '@angular/core';
import {TaskService} from '../../tasks/task.service';
import {ConfigurationService} from '../../services/configuration.service';
import {MatDialog} from '@angular/material';
import {ProjectService} from '../../services/project.service';
import {Project} from '../../models/projects';
import {Subject} from 'rxjs';
import {RepeatStringExtension} from '../../shared/pipes/repeatStringExtension';
import {takeUntil} from 'rxjs/operators';
import {SingleTask} from '../shared/single-task';
import {UpdateTask} from '../../tasks/task.actions';
import {AppStore} from '../../store';
import {Store} from '@ngrx/store';



@Component({
    selector: 'tickist-single-task-extended',
    templateUrl: './single-task-extended.component.html',
    styleUrls: ['./single-task-extended.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleTaskExtendedComponent extends SingleTask implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    @Input() task;
    @Input() mediaChange;
    @ViewChild('container') container: ElementRef;

    dateFormat = 'DD-MM-YYYY';
    projects: Project[];
    ngUnsubscribe: Subject<void> = new Subject<void>();
    typeFinishDateOptions: {};
    repeatString = '';
    repeatStringExtension;
    task_simple_view_value: string;
    task_extended_view_value: string;

    @HostListener('mouseenter')
    onMouseEnter() {
        this.isMouseOver = true;
        this.changeRightMenuVisiblity();
        this.isRightMenuVisible = true;
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        this.isMouseOver = false;
        this.changeRightMenuVisiblity();
        if (!this.isFastMenuVisible) {
            this.isRightMenuVisible = false;
        }

    }

    changeRightMenuVisiblity() {
        if (this.isMouseOver) {
            this.isRightMenuVisible = true;
        }
        if (!this.isMouseOver && this.isFastMenuVisible) {
            this.isRightMenuVisible = true;
        }
        if (!this.isMouseOver && !this.isFastMenuVisible) {
            this.isRightMenuVisible = false;
        }
    }

    constructor(private taskService: TaskService, private configurationService: ConfigurationService,
                public dialog: MatDialog, private projectService: ProjectService, private renderer: Renderer2,
                public store: Store<AppStore>) {
        super(store, dialog);
        this.repeatStringExtension = new RepeatStringExtension(this.configurationService);
    }

    ngOnInit() {
        this.task_simple_view_value = this.configurationService.TASK_SIMPLE_VIEW.value;
        this.task_extended_view_value = this.configurationService.TASK_EXTENDED_VIEW.value;
        this.projectService.projects$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((projects) => {
            this.projects = ProjectService.sortProjectList(projects);
        });
        if (this.mediaChange && this.mediaChange.mqAlias === 'xs') {
            this.dateFormat = 'DD-MM';
        }
        const repeatDelta = this.task.repeatDelta;
        const repeatDeltaExtension = this.repeatStringExtension.transform(this.task.repeat);
        this.repeatString = `every ${repeatDelta} ${repeatDeltaExtension}`;
    }

    ngAfterViewInit() {
        this.renderer.addClass(this.container.nativeElement, 'flow');
        this.renderer.addClass(this.container.nativeElement, 'row');
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    changeAssignedTo(event) {
        this.task.owner = this.task.taskProject.shareWith.find(user => user.id === event.value);
        this.store.dispatch(new UpdateTask({task: {id: this.task.id, changes: this.task}}));
        // this.taskService.updateTask(this.task, true, true);
    }

    changeProject(event) {
        this.task.taskProject = this.projects.find(project => project.id === event.value);
        this.store.dispatch(new UpdateTask({task: {id: this.task.id, changes: this.task}}));
        // this.taskService.updateTask(this.task, true, true);
    }

    removeTag(tag) {
        this.task.removeTag(tag);
        this.store.dispatch(new UpdateTask({task: {id: this.task.id, changes: this.task}}));
        // this.taskService.updateTask(this.task);
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (changes.hasOwnProperty('mediaChange') && changes['mediaChange'].hasOwnProperty('currentValue')
            && changes['mediaChange'].currentValue && changes['mediaChange'].currentValue.mqAlias === 'xs') {
            this.dateFormat = 'DD-MM';
        } else {
            this.dateFormat = 'DD-MM-YYYY';
        }
    }

    changeFastMenuVisible(value) {
        this.isFastMenuVisible = value;
        this.changeRightMenuVisiblity();
        console.log(value);
    }
}



