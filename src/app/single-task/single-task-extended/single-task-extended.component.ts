import {
    Component, OnInit, Input, OnDestroy, OnChanges, SimpleChange, ChangeDetectionStrategy,
    AfterViewInit, ElementRef, ViewChild, Renderer2, HostListener
} from '@angular/core';
import {TaskService} from '../../core/services/task.service';
import {ConfigurationService} from '../../services/configuration.service';
import {MatDialog, MatSelect} from '@angular/material';
import {ProjectService} from '../../services/project.service';
import {Project} from '../../models/projects';
import {Observable, Subject} from 'rxjs';
import {RepeatStringExtension} from '../../shared/pipes/repeatStringExtension';
import {takeUntil} from 'rxjs/operators';
import {SingleTask} from '../shared/single-task';
import {RequestUpdateTask, UpdateTask} from '../../core/actions/tasks/task.actions';
import {AppStore} from '../../store';
import {Store} from '@ngrx/store';
import {removeTag} from '../utils/task-utils';
import {selectFilteredProjectsList} from '../../modules/left-panel/modules/projects-list/projects-filters.selectors';
import {Task} from '../../models/tasks';
import {SimpleUser} from '../../core/models';
import {selectProjectById} from '../../core/selectors/projects.selectors';
import {convertToSimpleProject} from '../../core/utils/projects-utils';
import {FormControl} from '@angular/forms';


@Component({
    selector: 'tickist-single-task-extended',
    templateUrl: './single-task-extended.component.html',
    styleUrls: ['./single-task-extended.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleTaskExtendedComponent extends SingleTask implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    @Input() task: Task;
    @Input() mediaChange;
    @ViewChild('container') container: ElementRef;

    dateFormat = 'DD-MM-YYYY';
    projects$: Observable<Project[]>;
    projects: Project[];
    ngUnsubscribe: Subject<void> = new Subject<void>();
    repeatString = '';
    repeatStringExtension;
    task_simple_view_value: string;
    task_extended_view_value: string;
    selectTaskProject: FormControl;

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
        this.selectTaskProject = new FormControl(this.task.taskProject.id);
        this.task_simple_view_value = this.configurationService.TASK_SIMPLE_VIEW.value;
        this.task_extended_view_value = this.configurationService.TASK_EXTENDED_VIEW.value;
        this.projects$ = this.store.select(selectFilteredProjectsList);
        this.projects$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(projects => this.projects = projects);
        if (this.mediaChange && this.mediaChange.mqAlias === 'xs') {
            this.dateFormat = 'DD-MM';
        }
        const repeatDelta = this.task.repeatDelta;
        const repeatDeltaExtension = this.repeatStringExtension.transform(this.task.repeat);
        this.repeatString = `every ${repeatDelta} ${repeatDeltaExtension}`;
        this.amountOfStepsDoneInPercent = this.task.steps.filter(step => step.status === 1).length * 100 / this.task.steps.length;
        this.selectTaskProject.valueChanges.subscribe(value => {
            this.store.select(selectProjectById(value)).pipe(takeUntil(this.ngUnsubscribe)).subscribe(project => {
                const task = Object.assign({}, this.task, {taskProject: convertToSimpleProject(project)});
                this.store.dispatch(new RequestUpdateTask({task: {id: this.task.id, changes: task}}));
            });
        });
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
        this.task.owner = <SimpleUser> this.task
            .taskProject.shareWith.find(user => user.hasOwnProperty('id') && (<SimpleUser> user).id === event.value);
        this.store.dispatch(new RequestUpdateTask({task: {id: this.task.id, changes: this.task}}));
        // this.taskService.updateTask(this.task, true, true);
    }

    changeProject(event) {
        // this.selectTaskProject.close();
        // this.selectTaskProject.toggle();
        // this.selectTaskProject.panel.nativeElement.blur();
        // this.hideAllMenuElements();
        // this.store.select(selectProjectById(event.value)).pipe(takeUntil(this.ngUnsubscribe)).subscribe(project => {
        //     const task = Object.assign({}, this.task, {taskProject: convertToSimpleProject(project)});
        //     this.store.dispatch(new UpdateTask({task: {id: this.task.id, changes: task}}));
        // });
    }

    removeTag(tag) {
        this.task = removeTag(this.task,  tag);
        this.store.dispatch(new RequestUpdateTask({task: {id: this.task.id, changes: this.task}}));
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (changes.hasOwnProperty('mediaChange') && changes['mediaChange'].hasOwnProperty('currentValue')
            && changes['mediaChange'].currentValue && changes['mediaChange'].currentValue.mqAlias === 'xs') {
            this.dateFormat = 'DD-MM';
        } else {
            this.dateFormat = 'DD-MM-YYYY';
        }
        if (changes.hasOwnProperty('task') && changes.task.currentValue && this.selectTaskProject) {
            this.selectTaskProject.setValue(changes.task.currentValue.taskProject.id, {emitEvent: false});
        }
    }

    changeFastMenuVisible(value) {
        this.isFastMenuVisible = value;
        this.changeRightMenuVisiblity();
    }
}



