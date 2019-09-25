import {Component, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TaskService} from '../../../../core/services/task.service';
import {TagService} from '../../../../core/services/tag.service';
import {Task} from '@data/tasks/models/tasks';
import {combineLatest, Observable, Subject} from 'rxjs';
import {ProjectService} from '../../../../core/services/project.service';
import {UserService} from '../../../../core/services/user.service';
import {Project, ShareWithUser} from '@data//projects';
import {ConfigurationService} from '../../../../core/services/configuration.service';
import {User} from '@data/users/models';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Location} from '@angular/common';
import {Minutes2hoursPipe} from '../../../../shared/pipes/minutes2hours';
import {MatAutocompleteSelectedEvent, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {MatDialog} from '@angular/material/dialog';
import moment from 'moment';
import {Tag} from '@data/tags/models/tags';
import {DeleteTaskDialogComponent} from '../../../../single-task/delete-task-dialog/delete-task.dialog.component';
import {map, startWith, takeUntil} from 'rxjs/operators';
import {Step} from '@data/tasks/models/steps';
import {MyErrorStateMatcher} from '../../../../shared/error-state-matcher';
import {Store} from '@ngrx/store';
import {AppStore} from '../../../../store';
import {DeleteTask, RequestCreateTask, RequestUpdateTask} from '../../../../core/actions/tasks/task.actions';
import {selectAllTags} from '../../../../core/selectors/tags.selectors';
import {selectAllTasks} from '../../../../core/selectors/task.selectors';
import {moveFinishDateFromPreviousFinishDate, removeTag} from '../../../../single-task/utils/task-utils';
import {HideAddTaskButton, ShowAddTaskButton} from '../../../../core/actions/add-task-button-visibility.actions';
import {ITaskUser, TaskUser} from '@data/tasks/models/task-user';
import {TaskProject} from '@data/tasks/models/task-project';
import {createUniqueId} from '../../../../core/utils/unique-id';
import {CHOICES_DEFAULT_FINISH_DATE} from '@data/projects';
import {ProjectWithLevel} from '@data/projects';
import {selectAllProjectsWithLevelAndTreeStructures} from '../../../../core/selectors/projects.selectors';
import {parse} from 'date-fns';
import {addClickableLinks} from '@tickist/utils';

@Component({
    selector: 'tickist-task-component',
    templateUrl: './task.component.html',
    styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit, OnDestroy {
    ENTER = 'Enter';
    ARROW_DOWN = 'ArrowDown';
    ARROW_UP = 'ArrowUp';
    task: Task;
    tasks$: Observable<Task[]>;
    stream$: Observable<any>;
    projects: ProjectWithLevel[];
    selectedProject: Project;
    menu: Array<any>;
    user: User;
    taskForm: FormGroup;
    defaultRepeatOptions: {};
    customRepeatOptions: {};
    fromRepetingOptions: {};
    typeFinishDateOptions: any;
    defaultFinishDateOptions: any;
    minutes2Hours: Minutes2hoursPipe;
    steps: Step[];
    minDate: Date;
    tagsCtrl: FormControl;
    filteredTags: Observable<any>;
    tags: Tag[] = [];
    test: any;
    minFilter: any;
    matcher = new MyErrorStateMatcher();
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    @ViewChild('trigger', {read: MatAutocompleteTrigger, static: false}) trigger: MatAutocompleteTrigger;
    @ViewChild('autocompleteTags', {static: false}) autocompleteTags;

    constructor(private fb: FormBuilder, private route: ActivatedRoute, private taskService: TaskService, private store: Store<AppStore>,
                private projectService: ProjectService, private userService: UserService, public dialog: MatDialog,
                private configurationService: ConfigurationService, private location: Location,
                private tagService: TagService) {
    }

    ngOnInit() {
        this.minutes2Hours = new Minutes2hoursPipe;
        this.minDate = new Date();
        this.defaultRepeatOptions = this.configurationService.loadConfiguration()['commons']['DEFAULT_REPEAT_OPTIONS'];
        this.customRepeatOptions = this.configurationService.loadConfiguration()['commons']['CUSTOM_REPEAT_OPTIONS'];
        this.fromRepetingOptions = this.configurationService.loadConfiguration()['commons']['FROM_REPEATING_OPTIONS'];
        this.typeFinishDateOptions = this.configurationService.loadConfiguration()['commons']['TYPE_FINISH_DATE_OPTIONS'];
        this.defaultFinishDateOptions = CHOICES_DEFAULT_FINISH_DATE;
        this.typeFinishDateOptions = this.configurationService.configuration['commons']['TYPE_FINISH_DATE_OPTIONS'];
        this.tasks$ = this.store.select(selectAllTasks);
        this.stream$ = combineLatest(
            this.tasks$,
            this.route.params.pipe(map(params => params['taskId'])),
            this.projectService.selectedProject$,
            this.store.select(selectAllProjectsWithLevelAndTreeStructures),
            this.userService.user$
        );
        this.menu = this.createMenuDict();

        this.stream$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(([tasks, taskId, selectedProject, projects, user]) => {
            let task: Task;
            if (projects && tasks && projects.length > 0 && user) {
                this.user = user;

                this.projects = projects;
                if (taskId) {
                    task = tasks.filter(t => t.id === taskId)[0];
                    this.selectedProject = projects.find(project => project.id === task.taskProject.id)
                } else {
                    if (!selectedProject) {
                        this.selectedProject = projects.find(project => project.isInbox);
                    } else {
                        this.selectedProject = selectedProject;
                    }
                    task = this.createNewTask(this.selectedProject);
                }
            }
            if (task) {
                this.task = task;
                this.createFinishDateFilter();
                this.taskForm = this.createTaskForm(task);
            }
        });

        this.store.select(selectAllTags)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((tags: Tag[]) => {
                this.tags = tags;
                // this.filteredTags = this.tags.filter((tag) => this.task)
            });


        this.tagsCtrl = new FormControl();
        this.filteredTags = this.tagsCtrl.valueChanges
            .pipe(
                startWith(null),
                map(name => this.filterTags(name))
            );

        this.store.dispatch(new HideAddTaskButton());
    }

    @HostListener('window:keyup', ['$event'])
    keyEvent(event: KeyboardEvent) {
        if (event.key === this.ENTER && this.checkActiveItemInMenu('steps')) {
            this.addNewStep();
        }
        if (event.key === this.ARROW_DOWN && event.shiftKey) {
            this.nextMenuElement();
        }

        if (event.key === this.ARROW_UP && event.shiftKey) {
            this.previousMenuElement();
        }

    }

    getActiveMenuElement() {
        return this.menu.find(item => item.isActive);
    }

    previousMenuElement() {
        const activeMenuElement = this.getActiveMenuElement();
        let previousIndex = activeMenuElement.id - 1;
        if (previousIndex < 1) {
            previousIndex = this.menu.length;
        }
        return this.changeActiveItemInMenu(this.menu.find(item => item.id === previousIndex).name);
    }

    nextMenuElement() {
        const activeMenuElement = this.getActiveMenuElement();
        let nextIndex = activeMenuElement.id + 1;
        if (nextIndex > this.menu.length) {
            nextIndex = 1;
        }
        return this.changeActiveItemInMenu(this.menu.find(item => item.id === nextIndex).name);
    }

    filterTags(val: string) {
        if (val) {
            const tagsIds = [];
            this.task.tags.forEach((tag: Tag) => {
                tagsIds.push(tag.id);
            });
            return [
                ...this.tags
                    .filter(u => tagsIds.indexOf(u['id']) === -1)
                    .filter(u => new RegExp(val, 'gi').test(u.name)), {'name': val}
            ];

            // val ? this.tags.filter((s) => new RegExp(val, 'gi').test(s.name)) : {'name': val};
        }
        return [];
    }

    autocompleteTagsDisplayFn(tag: Tag): string | Tag {
        return tag ? tag.name : tag;
    }

    private createFinishDateFilter() {
        if (!this.task.finishDate || this.task.finishDate >= this.minDate) {
            this.minFilter = (d: Date): boolean => this.minDate.setHours(0, 0, 0, 0) <= d.setHours(0, 0, 0, 0);
        } else {
            this.minFilter = (d: Date): boolean => true;
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.configurationService.updateLeftSidenavVisibility();
        this.store.dispatch(new ShowAddTaskButton());
    }

    createMenuDict() {
        return [
            {
                name: 'main',
                isActive: true,
                id: 1
            }, {
                name: 'extra',
                isActive: false,
                id: 5
            }, {
                name: 'tags',
                isActive: false,
                id: 3
            }, {
                name: 'steps',
                isActive: false,
                id: 4
            }, {
                name: 'repeat',
                isActive: false,
                id: 2
            }, {
                name: 'notifications',
                isActive: false,
                id: 6
            }
        ];
    }

    createTaskForm(task: Task) {
        const repeat = {'repeatDelta': 1, 'repeatDefault': 0, 'repeatCustom': 1};
        let finishDate, finishTime;
        if (task.finishDate) {
            finishDate = task.finishDate;
        }
        if (task.finishTime) {
            finishTime = task.finishTime;
        }
        if (task.repeatDelta > 1) {
            repeat.repeatDelta = task.repeatDelta;
            repeat.repeatDefault = 99;
        } else {
            repeat.repeatDelta = 1;
            repeat.repeatDefault = task.repeat;
        }
        repeat.repeatCustom = (task.repeat > 0) ? task.repeat : 1;

        return new FormGroup({
            'main': new FormGroup({
                'name': new FormControl(task.name, {validators: [Validators.required, Validators.max(500)]}),
                'priority': new FormControl(task.priority, {updateOn: 'change'}),
                'taskProjectPk': new FormControl(task.taskProject.id, Validators.required),
                'typeFinishDate': new FormControl(task.typeFinishDate, Validators.required),
                'finishDate': new FormControl(finishDate),
                'finishTime': new FormControl(finishTime),
            }, {updateOn: 'blur'}),
            'extra': new FormGroup({
                'description': new FormControl(task.description),
                'time': new FormControl(this.minutes2Hours.transform(task.time)),
                'estimateTime': new FormControl(this.minutes2Hours.transform(task.estimateTime)),
                'ownerId': new FormControl(task.owner.id, {validators: Validators.required}),
                'suspended': new FormControl(task.onHold === true, {validators: Validators.required}),
                'suspendedDate': new FormControl(task.suspendDate),
            }, {validators: this.finishTimeWithFinishDate}),
            'repeat': new FormGroup({
                'repeatDefault': new FormControl(repeat.repeatDefault),
                'repeatDelta': new FormControl(repeat.repeatDelta),
                'repeatCustom': new FormControl(repeat.repeatCustom),
                'fromRepeating': new FormControl(task.fromRepeating)
            }),
            'tags': new FormGroup({
                'tags': new FormControl(''),
            }),
            'steps': this.initSteps(task.steps)
        });
    }

    private finishTimeWithFinishDate(g) {
        const result = null;
        return result;
    }

    clearFinishDate($event): void {
        const main = <FormGroup>this.taskForm.controls['main'];
        main.controls['finishDate'].setValue('');
        $event.stopPropagation();
    }

    clearFinishTime($event): void {
        const main = <FormGroup>this.taskForm.controls['main'];
        main.controls['finishTime'].setValue('');
        $event.stopPropagation();
    }

    clearSuspendedDate($event): void {
        const main = <FormGroup>this.taskForm.controls['extra'];
        main.controls['suspendedDate'].setValue('');
        $event.stopPropagation();
    }

    createNewTask(selectedProject: Project): Task {
        let defaultTypeFinishDate = 1;
        const finishDateOption = this.defaultFinishDateOptions
            .find((defaultFinishDateOption) => defaultFinishDateOption.id === selectedProject.defaultFinishDate);
        const isTypeFinishDateOptionsDefined = this.typeFinishDateOptions
            .some(typeFinishDateOption => typeFinishDateOption.id === selectedProject.defaultTypeFinishDate);

        if (isTypeFinishDateOptionsDefined) {
            defaultTypeFinishDate = selectedProject.defaultTypeFinishDate;
        }
        let task = new Task(<any>{
            'name': '',
            'priority': selectedProject.defaultPriority,
            'typeFinishDate': defaultTypeFinishDate,
            'finishDate': '',
            'finishTime': '',
            'suspendDate': '',
            'repeat': 0,
            'owner': new TaskUser(this.user),
            'ownerPk': this.user.id,
            'author': new TaskUser(this.user),
            'repeatDelta': 1,
            'fromRepeating': 0,
            'taskProject': new TaskProject({
                id: this.selectedProject.id,
                name: this.selectedProject.name,
                color: this.selectedProject.color,
                shareWithIds: selectedProject.shareWithIds
            }),
            'estimate_time': 0,
            'taskListPk': selectedProject.id,
            'time': undefined,
            'steps': [],
            'tags': []
        });

        if (finishDateOption) {
            if (finishDateOption.name === 'today') {
                task = moveFinishDateFromPreviousFinishDate(task, 'today');
            } else if (finishDateOption.name === 'tomorrow') {
                task = moveFinishDateFromPreviousFinishDate(task, 1);
            } else if (finishDateOption.name === 'next week') {
                task = moveFinishDateFromPreviousFinishDate(task, 7);
            } else if (finishDateOption.name === 'next month') {
                task = moveFinishDateFromPreviousFinishDate(task, 30);
            }
        }

        return task;
    }

    changeActiveItemInMenu(name): void {
        this.menu.forEach(item => item.isActive = false);
        this.menu.find(item => item.name === name).isActive = true;
    }

    checkActiveItemInMenu(name): boolean {
        return this.menu.find(item => item.name === name).isActive;
    }

    async addingTag(newTag) {
        // @TODO need refactoring It is duplicated code
        const tags = [...this.task.tags];
        if (this.tagsCtrl.valid) {
            if (newTag instanceof MatAutocompleteSelectedEvent) {
                if (newTag.option.value) {
                    if (newTag.option.value instanceof Tag) {
                        tags.push(new Tag(newTag.option.value));
                        if (!this.isNewTask()) {
                            this.store.dispatch(new RequestUpdateTask({
                                task: {
                                    id: this.task.id, changes: Object.assign({}, this.task, {tags: tags})
                                }
                            }));
                        } else {
                            this.task = Object.assign({}, this.task, {tags: tags, tagsIds: tags.map(tag=>tag.id)});
                        }

                    } else {
                        const tag = new Tag({name: newTag.option.value.name, author: this.user.id});
                        tag.id = await this.tagService.createTagDuringEditingTask(tag);
                        tags.push(tag);
                        if (!this.isNewTask()) {
                            this.store.dispatch(new RequestUpdateTask({
                                task: {
                                    id: this.task.id, changes: Object.assign({}, this.task, {tags: tags, tagsIds: tags.map(tag=>tag.id)})
                                }
                            }));
                        } else {
                            this.task = Object.assign({}, this.task, {tags: tags, tagsIds: tags.map(tag=>tag.id)});
                        }
                    }


                }
            } else {
                const existingTag = this.tags.filter((t: Tag) => t.name === this.tagsCtrl.value)[0];
                if (existingTag) {
                    tags.push(existingTag);
                    if (!this.isNewTask()) {
                        this.store.dispatch(new RequestUpdateTask({
                            task: {
                                id: this.task.id, changes: Object.assign({}, this.task, {tags: tags, tagsIds: tags.map(tag=>tag.id)})
                            }
                        }));
                    } else {
                        this.task = Object.assign({}, this.task, {tags: tags, tagsIds: tags.map(tag=>tag.id)});
                    }
                } else {
                    const tag = new Tag({name: this.tagsCtrl.value, author: this.user.id});
                    tag.id = await this.tagService.createTagDuringEditingTask(tag);
                    tags.push(tag);
                    if (!this.isNewTask()) {
                        this.store.dispatch(new RequestUpdateTask({
                            task: {
                                id: this.task.id, changes: Object.assign({}, this.task, {tags: tags, tagsIds: tags.map(tag=>tag.id)})
                            }
                        }));
                    } else {
                        this.task = Object.assign({}, this.task, {tags: tags, tagsIds: tags.map(tag =>tag.id)});
                    }
                }
            }
        } else {
            this.tagsCtrl.markAsDirty();
        }
        this.trigger.closePanel();
        this.tagsCtrl.reset();
    }

    removeTagFromTask(tag): void {
        this.task = removeTag(this.task, tag);
    }

    onSubmit(values, withoutClose = false): void {
        const updatedTask = Object.assign({}, this.task);
        if (this.taskForm.valid) {
            const selectedTaskProject = this.projects
                .find(project => project.id === values['main']['taskProjectPk']
                );
            updatedTask.name = values['main']['name'];
            updatedTask.richName = addClickableLinks(values['main']['name']);
            updatedTask.priority = values['main']['priority'];
            updatedTask.description = values['extra']['description'];
            updatedTask.richDescription = addClickableLinks(values['extra']['description']);
            updatedTask.finishDate = values['main']['finishDate'] ? values['main']['finishDate'] : null;
            updatedTask.finishTime = values['main']['finishTime'] ? values['main']['finishTime'] : '';
            updatedTask.suspendDate = values['extra']['suspendedDate'] ? moment(values['extra']['suspendedDate'], 'DD-MM-YYYY') : '';
            updatedTask.typeFinishDate = values['main']['typeFinishDate'];
            updatedTask.taskProject = new TaskProject(selectedTaskProject);
            const user = <ShareWithUser>selectedTaskProject.shareWith.filter(user => user['id'] === values['extra']['ownerId'])[0];
            updatedTask.owner = new TaskUser(<ITaskUser>{
                id: user.id,
                avatarUrl: user.avatarUrl,
                email: user.email,
                username: user.username
            });

            if (values['repeat']['repeatDefault'] !== 99) {
                updatedTask.repeat = values['repeat']['repeatDefault'];
                updatedTask.repeatDelta = 1;
            } else {
                updatedTask.repeatDelta = values['repeat']['repeatDelta'];
                updatedTask.repeat = values['repeat']['repeatCustom'];
            }
            updatedTask.onHold = values['extra']['suspended'];

            updatedTask.fromRepeating = values['repeat']['fromRepeating'];
            updatedTask.estimateTime = values['extra']['estimateTime'];
            updatedTask.time = values['extra']['time'];
            // We need to know which step will be deleted in the backend
            updatedTask.steps = this.task.steps.filter(step => step.delete);
            values['steps'].forEach((step, index) => {
                if (step.name !== '') {
                    updatedTask.steps.push(new Step({
                        'id': step.id,
                        'name': step.name,
                        'order': index,
                        'status': step.status
                    }));
                }
            });
            if (this.isNewTask()) {
                this.store.dispatch(new RequestCreateTask({task: updatedTask}));
            } else {
                this.store.dispatch(new RequestUpdateTask({task: {id: updatedTask.id, changes: updatedTask}}));
            }

            if (!withoutClose) {
                this.close();
            }
        } else {
            this.taskForm.markAsTouched();
            Object.keys(this.taskForm.controls).forEach((controlName) => {
                this.taskForm.controls[controlName].markAsTouched();
            });
        }

    }

    close(): void {
        // DRY
        this.location.back();
    }

    getErrorMessage(field: AbstractControl): string {
        return field.hasError('maxLength') ? 'Name is too long' :
            field.hasError('required') ? 'You have to add task name' : '';
    }

    hasErrorMessage(field: AbstractControl): boolean {
        return field.hasError('maxLength') || field.hasError('required');
    }

    initSteps(steps: Step[]) {
        const array = [];
        steps.filter(step => !step.delete).forEach((step: Step) => {
            array.push(this.fb.group({
                'name': [step.name, Validators.required],
                'id': [step.id, Validators.required],
                'status': [step.status, Validators.required]
            }));
        });
        array.push(this.initStep());

        return this.fb.array(array);
    }

    initStep() {
        return this.fb.group({
            'name': [''],
            'id': [createUniqueId()],
            'status': [0]
        });
    }

    addNewStep() {
        const control = <FormArray>this.taskForm.controls['steps'];
        control.push(this.initStep());
    }

    removeStep(i: number) {
        const control = <FormArray>this.taskForm.controls['steps'];
        // delete steps from task model
        const steps = [...this.task.steps];
        if (control.controls[i].value.hasOwnProperty('id')) {
            steps.map(step => {
                const updatedStep = {...step};
                if (updatedStep.id === control.controls[i].value.id) {
                    updatedStep.delete = true;
                }
                return updatedStep;
            });
        }
        control.removeAt(i);
        this.task = Object.assign({}, this.task, {steps: steps});
    }

    changeProjectInTask(event): void {
        const newProject = this.projects.find(project => project.id === event.value);
        this.task = Object.assign(
            {},
            this.task,
            {taskProject: new TaskProject(this.projects.find(project => project.id === event.value))}
        );
        const extra = <FormGroup>this.taskForm.controls['extra'];
        extra.controls['ownerId'].setValue(this.user.id);
        this.selectedProject = newProject;
    }

    createAndAddMore($event, values): void {
        this.onSubmit(values, true);
        this.task = this.createNewTask(this.selectedProject);
        this.taskForm.reset();
        this.taskForm = this.createTaskForm(this.task);
    }

    updateImmediately(source, formControlName, values): void {
        if (this.task.id) {
            if (this.task[source] !== this.taskForm.get(formControlName).value) {
                this.onSubmit(values, true);
            }
        }
    }

    deleteTask(): void {
        const dialogRef = this.dialog.open(DeleteTaskDialogComponent);
        dialogRef.afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(result => {
                if (result) {
                    this.store.dispatch(new DeleteTask({taskId: this.task.id}));
                    // this.taskService.deleteTask(this.task.id);
                    this.close();
                }
            });
    }

    isNewTask(): boolean {
        return !this.task.id;
    }
}
