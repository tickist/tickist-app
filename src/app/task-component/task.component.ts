import {
    Component, OnInit, OnDestroy, ViewChild, Renderer2,
    ElementRef, HostListener
} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TaskService} from '../services/task-service';
import {TagService} from '../services/tag-service';
import {Task} from '../models/tasks';
import {Observable, Subscription, pipe, combineLatest} from 'rxjs';

import {ProjectService} from '../services/project-service';
import {UserService} from '../services/userService';
import {Project} from '../models/projects';
import {ConfigurationService} from '../services/configurationService';
import {User, SimplyUser} from '../models/user';
import {FormBuilder, FormGroup, Validators, FormArray, FormControl, AbstractControl} from '@angular/forms';
import {Location} from '@angular/common';
import {Minutes2hoursPipe} from '../shared/pipes/minutes2hours';
import {MatDialogRef, MatDialog, MatAutocompleteSelectedEvent} from '@angular/material';
import * as moment from 'moment';
import {Tag} from '../models/tags';
import * as _ from 'lodash';

import {MatAutocompleteTrigger, MatInput} from '@angular/material';
import {DeleteTaskDialogComponent} from '../single-task/delete-task-dialog/delete-task.dialog.component';
import {KEY_CODE} from '../shared/keymap';
import { map, startWith } from 'rxjs/operators';
import {Step} from '../models/steps';
import {MyErrorStateMatcher} from '../shared/error-state-matcher';

@Component({
    selector: 'app-task-component',
    templateUrl: './task.component.html',
    styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit, OnDestroy {
    task: Task;
    stream$: Observable<any>;
    projects: Project[];
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
    steps: any;
    minDate: Date;
    subscriptions: Subscription;
    tagsCtrl: FormControl;
    filteredTags: Observable<any>;
    tags: Tag[] = [];
    test: any;
    minFilter: any;
    matcher = new MyErrorStateMatcher();

    @ViewChild('trigger', {read: MatAutocompleteTrigger}) trigger: MatAutocompleteTrigger;
    @ViewChild('autocompleteTags') autocompleteTags;

    constructor(private fb: FormBuilder, private route: ActivatedRoute, private taskService: TaskService,
                private projectService: ProjectService, private userService: UserService, public dialog: MatDialog,
                private configurationService: ConfigurationService, private location: Location,
                private tagService: TagService, protected renderer: Renderer2, private elRef: ElementRef) {
    }

    ngOnInit() {
        this.minutes2Hours = new Minutes2hoursPipe;
        this.minDate = new Date();
        this.defaultRepeatOptions = this.configurationService.loadConfiguration()['commons']['DEFAULT_REPEAT_OPTIONS'];
        this.customRepeatOptions = this.configurationService.loadConfiguration()['commons']['CUSTOM_REPEAT_OPTIONS'];
        this.fromRepetingOptions = this.configurationService.loadConfiguration()['commons']['FROM_REPEATING_OPTIONS'];
        this.typeFinishDateOptions = this.configurationService.loadConfiguration()['commons']['TYPE_FINISH_DATE_OPTIONS'];
        this.defaultFinishDateOptions = this.configurationService.configuration['commons']['CHOICES_DEFAULT_FINISH_DATE'];
        this.typeFinishDateOptions = this.configurationService.configuration['commons']['TYPE_FINISH_DATE_OPTIONS'];
        this.stream$ = combineLatest(
                this.taskService.tasks$,
                this.route.params.pipe(map(params => params['taskId'])),
                this.projectService.selectedProject$,
                this.projectService.projects$,
                this.userService.user$,
                (tasks: Task[], taskId: string, selectedProject: Project, projects: Project[], user: User) => {
                    let task: Task;
                    if (projects && tasks && projects.length > 0 && user && tasks.length > 0) {
                        this.user = user;
                        this.projects = ProjectService.sortProjectList(projects);
                        if (taskId) {
                            task = tasks.filter(t => t.id === parseInt(taskId, 10))[0];
                        } else {
                            if (!selectedProject) {
                                this.selectedProject = projects.filter(project => project.id === user.inboxPk)[0];
                            } else {
                                this.selectedProject = selectedProject;
                            }
                            task = this.createNewTask(this.selectedProject);
                        }
                    }
                    return task;
                }
            );
        this.menu = this.createMenuDict();

        this.subscriptions = this.stream$.subscribe((task) => {
            if (task) {
                this.task = task;
                this.createFinishDateFilter();
                this.taskForm = this.createTaskForm(task);
            }
        });
        this.subscriptions.add(
            this.tagService.tags$.subscribe((tags: Tag[]) => {
                this.tags = tags;
                // this.filteredTags = this.tags.filter((tag) => this.task)
            })
        );

        this.tagsCtrl = new FormControl();
        this.filteredTags = this.tagsCtrl.valueChanges
            .pipe(
                startWith(null),
                map(name => this.filterTags(name))
            );

        this.configurationService.changeOpenStateLeftSidenavVisibility('close');
        this.configurationService.changeOpenStateRightSidenavVisibility('close');
        this.configurationService.updateAddTaskComponentVisibility(false);
    }

    @HostListener('window:keyup', ['$event'])
    keyEvent(event: KeyboardEvent) {
        console.log(event);
        if (event.keyCode === KEY_CODE.ENTER && this.checkActiveItemInMenu('steps')) {
            this.addNewStep();
        }
        if (event.keyCode === KEY_CODE.DOWN_ARROW && event.shiftKey) {
            this.nextMenuElement();
        }

        if (event.keyCode === KEY_CODE.UP_ARROW && event.shiftKey) {
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
        console.log(val);
        if (val) {
            const tagsIds = [];
            this.task.tags.forEach((tag: Tag) => {
                tagsIds.push(tag.id);
            });
            const aa = [...this.tags.filter(u => tagsIds.indexOf(u['id']) === -1).filter(u => new RegExp(val, 'gi').test(u.name)), {'name': val}];
            return aa;
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
        this.subscriptions.unsubscribe();
        this.configurationService.updateLeftSidenavVisibility();
        this.configurationService.updateRightSidenavVisibility();
        this.configurationService.updateAddTaskComponentVisibility(true);
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
            finishDate = task.finishDate.toDate();
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
            }, { updateOn: 'blur' }),
            'extra': new FormGroup({
                'description': new FormControl(task.description),
                'time': new FormControl(this.minutes2Hours.transform(task.time)),
                'estimateTime': new FormControl(this.minutes2Hours.transform(task.estimateTime)),
                'ownerId': new FormControl(task.owner.id, {validators: Validators.required}),
                'suspended': new FormControl(task.status === 2, {validators: Validators.required}),
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

    private finishTimeWithFinishDate(group: any) {
        // let oldPassword = group.controls.oldPassword;
        // let newPassword = group.controls.newPassword;
        // let confirmNewPassword = group.controls.confirmNewPassword;
        const result = null;
        // if (newPassword.value !== confirmNewPassword.value) {
        //  result = {
        //    mismatchedPasswords: true
        //  };
        // }
        // if (oldPassword.value === newPassword.value) {
        //  result = {
        //    oldSameNew: true
        //  };
        // }
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
        const task = new Task({
            'name': '',
            'priority': selectedProject.defaultPriority,
            'description': '',
            'type_finish_date': defaultTypeFinishDate,
            'finish_date': '',
            'suspended': false,
            'suspendedDate': '',
            'repeat': 0,
            'owner': this.user.toApi(),
            'author': this.user.toApi(),
            'repeat_delta': 1,
            'from_repeating': 0,
            'task_project': selectedProject.toApi(),
            'estimateTime': '',
            'time': '',
            'steps': [],
            'tags': [],
            'status': 0,
            'is_active': true,
            'percentage': 0,
            'pinned': false
        });

        if (finishDateOption) {
            if (finishDateOption.name === 'today') {
                task.moveFinishDateFromPreviousFinishDate('today');
            } else if (finishDateOption.name === 'tomorrow') {
                task.moveFinishDateFromPreviousFinishDate(1);
            } else if (finishDateOption.name === 'next week') {
                task.moveFinishDateFromPreviousFinishDate(7);
            } else if (finishDateOption.name === 'next month') {
                task.moveFinishDateFromPreviousFinishDate(30);
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

    addingTag(newTag) {
        if (this.tagsCtrl.valid) {

            if (newTag instanceof MatAutocompleteSelectedEvent) {
                if (newTag.option.value) {
                     this.tagService.createTagDuringEditingTask(new Tag({name: newTag.option.value.name})).subscribe((t) => {
                        this.task.tags.push(new Tag(t));
                        if (!this.isNewTask()) {
                            this.taskService.saveTask(this.task);
                        }

                    });
                }
            } else {
                const existingTag = this.tags.filter((t: Tag) => t.name === this.tagsCtrl.value)[0];
                if (existingTag) {
                    this.task.tags.push(existingTag);
                    if (!this.isNewTask()) {
                        this.taskService.saveTask(this.task);
                    }
                } else {
                    this.tagService.createTagDuringEditingTask(new Tag({name: this.tagsCtrl.value})).subscribe((t) => {
                        this.task.tags.push(new Tag(t));
                        if (!this.isNewTask()) {
                            this.taskService.saveTask(this.task);
                        }

                    });
                }
            }
        } else {
            this.tagsCtrl.markAsDirty();
        }
        this.trigger.closePanel();
        this.tagsCtrl.reset();
    }

    removeTagFromTask(tag): void {
        this.task.removeTag(tag);
    }

    onSubmit(values, withoutClose = false): void {
        if (this.taskForm.valid) {
            this.task.name = values['main']['name'];
            this.task.priority = values['main']['priority'];
            this.task.description = values['extra']['description'];
            this.task.finishDate = values['main']['finishDate'] ? moment(values['main']['finishDate'], 'DD-MM-YYYY') : '';
            this.task.finishTime = values['main']['finishTime'] ? values['main']['finishTime'] : '';
            this.task.suspendDate = values['extra']['suspendedDate'] ? moment(values['extra']['suspendedDate'], 'DD-MM-YYYY') : '';
            this.task.typeFinishDate = values['main']['typeFinishDate'];
            this.task.taskProject = this.projects.filter(project => project.id === parseInt(values['main']['taskProjectPk'], 10))[0];
            this.task.owner = <SimplyUser>this.task.taskProject.shareWith.filter(user => user['id'] === values['extra']['ownerId'])[0];

            if (values['repeat']['repeatDefault'] !== 99) {
                this.task.repeat = values['repeat']['repeatDefault'];
                this.task.repeatDelta = 1;
            } else {
                this.task.repeatDelta = values['repeat']['repeatDelta'];
                this.task.repeat = values['repeat']['repeatCustom'];
            }
            if (values['extra']['suspended']) {
                this.task.status = 2;
            }
            if (!values['extra']['suspended'] && this.task.status === 2) {
                this.task.status = 0;
            }

            this.task.fromRepeating = values['repeat']['fromRepeating'];
            this.task.estimateTime = values['extra']['estimateTime'];
            this.task.time = values['extra']['time'];
            // We need to know which step will be deleted in the backend
            this.task.steps = this.task.steps.filter(step => step.delete);
            values['steps'].forEach((step, index) => {
                if (step.name !== '') {
                    this.task.steps.push(new Step({
                        'id': step.id,
                        'name': step.name,
                        'order': index,
                        'status': step.status
                    }));
                }
            });

            this.taskService.saveTask(this.task);

            if (!withoutClose) {
                this.close();
            }
        } else {
            this.taskForm.markAsTouched();
            Object.keys(this.taskForm.controls).forEach((controlName) => {
                this.taskForm.controls[controlName].markAsTouched();
                // Object.keys(<FormGroup>this.taskForm.controls[controlName].controls).forEach((cN) => {
                //   <FormGroup>this.taskForm.controls[controlName].controls[cN].markAsTouched();
                // })
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
        return field.hasError('maxLength') ||  field.hasError('required');
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
            'id': [''],
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
        if (control.controls[i].value.hasOwnProperty('id')) {
            this.task.steps.map(step => {
                if (step.id === control.controls[i].value.id) {
                    step.delete = true;
                }
            });
        }
        control.removeAt(i);
    }

    changeProjectInTask(event) {
        this.task.taskProject = this.projects.find((project) => project.id === event.value);
        const extra = <FormGroup>this.taskForm.controls['extra'];
        extra.controls['ownerId'].setValue(this.user.id);
    }

    createAndAddMore($event, values) {
        this.onSubmit(values, true);
        this.task = this.createNewTask(this.selectedProject);
        this.taskForm.reset();
        this.taskForm = this.createTaskForm(this.task);
    }

    updateImmediately(source, formControlName, values) {
        if (this.task.id) {
            if (this.task[source] !== this.taskForm.get(formControlName).value) {
                this.onSubmit(values, true);
            }
        }
    }

    deleteTask() {
        const dialogRef = this.dialog.open(DeleteTaskDialogComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.taskService.deleteTask(this.task);
                this.close();
            }
        });
    }

    isNewTask(): boolean {
        return Number.isInteger(this.task.id );
    }
}
