import { Component, HostListener, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { TaskService } from "../../../../core/services/task.service";
import { TagService } from "../../../../core/services/tag.service";
import { combineLatest, Observable, Subject } from "rxjs";
import { ProjectService } from "../../../../core/services/project.service";
import { UserService } from "../../../../core/services/user.service";
import { Project, ProjectType, ShareWithUser } from "@data//projects";
import { ConfigurationService } from "../../../../core/services/configuration.service";
import { User } from "@data/users/models";
import {
    AbstractControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    UntypedFormArray,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    Validators,
} from "@angular/forms";
import { AsyncPipe, Location, NgClass, NgFor, NgIf, NgStyle } from "@angular/common";
import { Minutes2hoursPipe } from "../../../../shared/pipes/minutes2hours";
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatDialog } from "@angular/material/dialog";
import moment from "moment";
import { Tag } from "@data/tags/models/tags";
import { DeleteTaskDialogComponent } from "../../../../single-task/delete-task-dialog/delete-task.dialog.component";
import { map, startWith, takeUntil } from "rxjs/operators";
import { Step } from "@data/tasks/models/steps";
import { MyErrorStateMatcher } from "../../../../shared/error-state-matcher";
import { Store } from "@ngrx/store";
import { deleteTask, requestCreateTask, requestUpdateTask } from "../../../../core/actions/tasks/task.actions";
import { selectAllTags } from "../../../../core/selectors/tags.selectors";
import { selectAllTasks } from "../../../../core/selectors/task.selectors";
import { moveFinishDateFromPreviousFinishDate, removeTag } from "../../../../single-task/utils/task-utils";
import { ITaskUser, TaskUser } from "@data/tasks/models/task-user";
import { TaskProject } from "@data/tasks/models/task-project";
import { addClickableLinks, changeTimeStringFormatToValue, createUniqueId } from "@tickist/utils";
import { CHOICES_DEFAULT_FINISH_DATE, ProjectWithLevel } from "@data/projects";
import { selectActiveProject, selectAllProjectsWithLevelAndTreeStructures } from "../../../../core/selectors/projects.selectors";
import { selectLoggedInUser } from "../../../../core/selectors/user.selectors";
import { AVAILABLE_TASK_TYPES, AVAILABLE_TASK_TYPES_ICONS, Task } from "@data";
import { zip } from "ramda";
import { hideAddTaskButton, showAddTaskButton } from "../../../../core/actions/add-task-button-visibility.actions";
import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { MatCardModule } from "@angular/material/card";
import { FlexModule } from "@ngbracket/ngx-layout/flex";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatListModule } from "@angular/material/list";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { A11yModule } from "@angular/cdk/a11y";
import { MatSelectModule } from "@angular/material/select";
import { DataCyDirective } from "../../../../shared/directives/data-cy.directive";
import { MatOptionModule } from "@angular/material/core";
import { PriorityComponent } from "../../../../shared/components/priority/priority.component";
import { MatRadioModule } from "@angular/material/radio";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatButtonModule } from "@angular/material/button";
import { UserAvatarComponent } from "../../../../shared/components/user-avatar/user-avatar.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ColorPickerComponent } from "../../../edit-project/components/color-picker/color-picker.component";
import { IconPickerComponent } from "../../../edit-project/components/icon-picker/icon-picker.component";
import { MatChipsModule } from "@angular/material/chips";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MenuButtonComponent } from "../../../../shared/components/menu-button/menu-button.component";

@Component({
    selector: "tickist-task-component",
    templateUrl: "./task.component.html",
    styleUrls: ["./task.component.scss"],
    standalone: true,
    imports: [
        MatCardModule,
        FlexModule,
        NgIf,
        FormsModule,
        ReactiveFormsModule,
        FaIconComponent,
        MatListModule,
        NgClass,
        ExtendedModule,
        MatFormFieldModule,
        MatInputModule,
        A11yModule,
        MatSelectModule,
        DataCyDirective,
        NgFor,
        MatOptionModule,
        PriorityComponent,
        MatRadioModule,
        NgStyle,
        MatCheckboxModule,
        MatAutocompleteModule,
        MatButtonModule,
        UserAvatarComponent,
        MatProgressSpinnerModule,
        MatTooltipModule,
        ColorPickerComponent,
        IconPickerComponent,
        AsyncPipe,
        DragDropModule,
        MatChipsModule,
        MatDatepickerModule,
        MenuButtonComponent,
    ],
})
export class TaskComponent implements OnInit, OnDestroy {
    @ViewChild("trigger", { read: MatAutocompleteTrigger })
    @ViewChild("autocompleteTags")
    autocompleteTags;
    enter = "Enter";
    arrowDown = "ArrowDown";
    arrowUp = "ArrowUp";
    task: Task;
    stream$: Observable<any>;
    projects: ProjectWithLevel[];
    selectedProject: Project;
    menu: Array<any>;
    user: User;
    taskForm: UntypedFormGroup;
    defaultRepeatOptions: any;
    customRepeatOptions: any;
    fromRepetingOptions: any;
    typeFinishDateOptions: any;
    defaultFinishDateOptions: any;
    minutes2Hours: Minutes2hoursPipe;
    steps: Step[];
    minDate: Date;
    tagsCtrl: UntypedFormControl;
    filteredTags: Observable<any>;
    tags: Tag[] = [];
    test: any;
    minFilter: any;
    matcher = new MyErrorStateMatcher();
    taskTypes = AVAILABLE_TASK_TYPES;
    taskTypesWithIcons: any;

    trigger: MatAutocompleteTrigger;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private fb: UntypedFormBuilder,
        private route: ActivatedRoute,
        private taskService: TaskService,
        private store: Store,
        private projectService: ProjectService,
        private userService: UserService,
        public dialog: MatDialog,
        private configurationService: ConfigurationService,
        private location: Location,
        private tagService: TagService,
    ) {
        this.taskTypesWithIcons = zip(AVAILABLE_TASK_TYPES, AVAILABLE_TASK_TYPES_ICONS).map((taskType) => ({
            value: taskType[0],
            icon: taskType[1],
        }));
    }

    @HostListener("window:keyup", ["$event"])
    keyEvent(event: KeyboardEvent) {
        if (event.key === this.enter && this.checkActiveItemInMenu("steps")) {
            this.addNewStep();
        }
        if (event.key === this.arrowDown && event.shiftKey) {
            this.nextMenuElement();
        }

        if (event.key === this.arrowUp && event.shiftKey) {
            this.previousMenuElement();
        }
    }

    ngOnInit() {
        this.minutes2Hours = new Minutes2hoursPipe();
        this.minDate = new Date();
        this.defaultRepeatOptions = this.configurationService.loadConfiguration().commons.defaultRepeatOptions;
        this.customRepeatOptions = this.configurationService.loadConfiguration().commons.customRepeatOptions;
        this.fromRepetingOptions = this.configurationService.loadConfiguration().commons.fromRepeatingOptions;
        this.typeFinishDateOptions = this.configurationService.loadConfiguration().commons.typeFinishDateOptions;
        this.defaultFinishDateOptions = CHOICES_DEFAULT_FINISH_DATE;
        this.typeFinishDateOptions = this.configurationService.configuration.commons.typeFinishDateOptions;
        this.stream$ = combineLatest([
            this.store.select(selectAllTasks),
            this.route.params.pipe(map((params) => params["taskId"])),
            this.store.select(selectActiveProject),
            this.store.select(selectAllProjectsWithLevelAndTreeStructures),
            this.store.select(selectLoggedInUser),
        ]);
        this.menu = this.createMenuDict();

        this.stream$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(([tasks, taskId, selectedProject, projects, user]) => {
            let task: Task;
            if (projects && tasks && projects.length > 0 && user) {
                this.user = user;

                this.projects = projects;
                if (taskId) {
                    task = tasks.filter((t) => t.id === taskId)[0];
                    this.selectedProject = projects.find((project) => project.id === task.taskProject.id);
                } else {
                    if (!selectedProject) {
                        this.selectedProject = projects.find((project) => project.projectType === ProjectType.inbox);
                    } else {
                        this.selectedProject = selectedProject;
                    }
                    if (this.selectedProject) {
                        task = this.createNewTask(this.selectedProject);
                    }
                }
            }
            if (task) {
                this.task = task;
                this.createFinishDateFilter();
                this.taskForm = this.createTaskForm(task);
            }
        });

        this.store
            .select(selectAllTags)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((tags: Tag[]) => {
                this.tags = tags;
                // this.filteredTags = this.tags.filter((tag) => this.task)
            });

        this.tagsCtrl = new UntypedFormControl();
        this.filteredTags = this.tagsCtrl.valueChanges.pipe(
            startWith(null),
            map((name) => this.filterTags(name)),
        );

        this.store.dispatch(hideAddTaskButton());
    }

    getActiveMenuElement() {
        return this.menu.find((item) => item.isActive);
    }

    previousMenuElement() {
        const activeMenuElement = this.getActiveMenuElement();
        let previousIndex = activeMenuElement.id - 1;
        if (previousIndex < 1) {
            previousIndex = this.menu.length;
        }
        return this.changeActiveItemInMenu(this.menu.find((item) => item.id === previousIndex).name);
    }

    nextMenuElement() {
        const activeMenuElement = this.getActiveMenuElement();
        let nextIndex = activeMenuElement.id + 1;
        if (nextIndex > this.menu.length) {
            nextIndex = 1;
        }
        return this.changeActiveItemInMenu(this.menu.find((item) => item.id === nextIndex).name);
    }

    filterTags(val: string) {
        if (val) {
            const tagsIds = [];
            this.task.tags.forEach((tag: Tag) => {
                tagsIds.push(tag.id);
            });
            return [
                ...this.tags.filter((u) => tagsIds.indexOf(u["id"]) === -1).filter((u) => new RegExp(val, "gi").test(u.name)),
                { name: val },
            ];
        }
        return [];
    }

    autocompleteTagsDisplayFn(tag: Tag): string | Tag {
        return tag ? tag.name : tag;
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.configurationService.updateLeftSidenavVisibility();
        this.store.dispatch(showAddTaskButton());
    }

    createMenuDict() {
        return [
            {
                name: "main",
                isActive: true,
                id: 1,
            },
            {
                name: "extra",
                isActive: false,
                id: 5,
            },
            {
                name: "tags",
                isActive: false,
                id: 3,
            },
            {
                name: "steps",
                isActive: false,
                id: 4,
            },
            {
                name: "repeat",
                isActive: false,
                id: 2,
            },
            {
                name: "notifications",
                isActive: false,
                id: 6,
            },
        ];
    }

    createTaskForm(task: Task) {
        const repeat = { repeatDelta: 1, repeatDefault: 0, repeatCustom: 1 };
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
        repeat.repeatCustom = task.repeat > 0 ? task.repeat : 1;

        return new UntypedFormGroup({
            main: new UntypedFormGroup(
                {
                    name: new UntypedFormControl(task.name, {
                        validators: [Validators.required, Validators.max(500)],
                    }),
                    priority: new UntypedFormControl(task.priority, {
                        updateOn: "change",
                    }),
                    taskType: new UntypedFormControl(task.taskType, Validators.required),
                    taskProjectPk: new UntypedFormControl(task.taskProject.id, Validators.required),
                    typeFinishDate: new UntypedFormControl(task.typeFinishDate, Validators.required),
                    finishDate: new UntypedFormControl(finishDate),
                    finishTime: new UntypedFormControl(finishTime),
                },
                { updateOn: "blur" },
            ),
            extra: new UntypedFormGroup(
                {
                    description: new UntypedFormControl(task.description),
                    time: new UntypedFormControl(this.minutes2Hours.transform(task.time)),
                    estimateTime: new UntypedFormControl(this.minutes2Hours.transform(task.estimateTime)),
                    ownerId: new UntypedFormControl(task.owner.id, {
                        validators: Validators.required,
                    }),
                    suspended: new UntypedFormControl(task.onHold === true, {
                        validators: Validators.required,
                    }),
                    suspendedDate: new UntypedFormControl(task.suspendDate),
                },
                { validators: this.finishTimeWithFinishDate },
            ),
            repeat: new UntypedFormGroup({
                repeatDefault: new UntypedFormControl(repeat.repeatDefault),
                repeatDelta: new UntypedFormControl(repeat.repeatDelta),
                repeatCustom: new UntypedFormControl(repeat.repeatCustom),
                fromRepeating: new UntypedFormControl(task.fromRepeating),
            }),
            tags: new UntypedFormGroup({
                tags: new UntypedFormControl(""),
            }),
            steps: this.initSteps(task.steps),
        });
    }

    clearFinishDate($event): void {
        const main = <UntypedFormGroup>this.taskForm.controls["main"];
        main.controls["finishDate"].setValue("");
        $event.stopPropagation();
    }

    clearFinishTime($event): void {
        const main = <UntypedFormGroup>this.taskForm.controls["main"];
        main.controls["finishTime"].setValue("");
        $event.stopPropagation();
    }

    clearSuspendedDate($event): void {
        const main = <UntypedFormGroup>this.taskForm.controls["extra"];
        main.controls["suspendedDate"].setValue("");
        $event.stopPropagation();
    }

    createNewTask(selectedProject: Project): Task {
        let defaultTypeFinishDate = 1;
        const finishDateOption = this.defaultFinishDateOptions.find(
            (defaultFinishDateOption) => defaultFinishDateOption.id === selectedProject.defaultFinishDate,
        );
        const isTypeFinishDateOptionsDefined = this.typeFinishDateOptions.some(
            (typeFinishDateOption) => typeFinishDateOption.id === selectedProject.defaultTypeFinishDate,
        );

        if (isTypeFinishDateOptionsDefined) {
            defaultTypeFinishDate = selectedProject.defaultTypeFinishDate;
        }
        let task = new Task(<any>{
            name: "",
            priority: selectedProject.defaultPriority,
            typeFinishDate: defaultTypeFinishDate,
            finishDate: "",
            finishTime: "",
            suspendDate: "",
            repeat: 0,
            owner: new TaskUser(this.user),
            ownerPk: this.user.id,
            author: new TaskUser(this.user),
            repeatDelta: 1,
            fromRepeating: 0,
            taskProject: new TaskProject({
                id: this.selectedProject.id,
                name: this.selectedProject.name,
                color: this.selectedProject.color,
                shareWithIds: selectedProject.shareWithIds,
                icon: this.selectedProject.icon,
            }),
            estimateTime: 0,
            taskListPk: selectedProject.id,
            time: undefined,
            steps: [],
            tags: [],
        });

        if (finishDateOption) {
            if (finishDateOption.name === "today") {
                task = moveFinishDateFromPreviousFinishDate(task, "today");
            } else if (finishDateOption.name === "tomorrow") {
                task = moveFinishDateFromPreviousFinishDate(task, 1);
            } else if (finishDateOption.name === "next week") {
                task = moveFinishDateFromPreviousFinishDate(task, 7);
            } else if (finishDateOption.name === "next month") {
                task = moveFinishDateFromPreviousFinishDate(task, 30);
            }
        }

        return task;
    }

    changeActiveItemInMenu(name): void {
        this.menu.forEach((item) => (item.isActive = false));
        this.menu.find((item) => item.name === name).isActive = true;
    }

    checkActiveItemInMenu(name): boolean {
        return this.menu.find((item) => item.name === name).isActive;
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
                            this.store.dispatch(
                                requestUpdateTask({
                                    task: {
                                        id: this.task.id,
                                        changes: Object.assign({}, this.task, {
                                            tags: tags,
                                        }),
                                    },
                                }),
                            );
                        } else {
                            this.task = Object.assign({}, this.task, {
                                tags: tags,
                                tagsIds: tags.map((tag) => tag.id),
                            });
                        }
                    } else {
                        const tag = new Tag({
                            name: newTag.option.value.name,
                            author: this.user.id,
                        });
                        tag.id = await this.tagService.createTagDuringEditingTask(tag);
                        tags.push(tag);
                        if (!this.isNewTask()) {
                            this.store.dispatch(
                                requestUpdateTask({
                                    task: {
                                        id: this.task.id,
                                        changes: Object.assign({}, this.task, {
                                            tags: tags,
                                            tagsIds: tags.map((t) => t.id),
                                        }),
                                    },
                                }),
                            );
                        } else {
                            this.task = Object.assign({}, this.task, {
                                tags: tags,
                                tagsIds: tags.map((t) => t.id),
                            });
                        }
                    }
                }
            } else {
                const existingTag = this.tags.filter((t: Tag) => t.name === this.tagsCtrl.value)[0];
                if (existingTag) {
                    tags.push(existingTag);
                    if (!this.isNewTask()) {
                        this.store.dispatch(
                            requestUpdateTask({
                                task: {
                                    id: this.task.id,
                                    changes: Object.assign({}, this.task, {
                                        tags: tags,
                                        tagsIds: tags.map((t) => t.id),
                                    }),
                                },
                            }),
                        );
                    } else {
                        this.task = Object.assign({}, this.task, {
                            tags: tags,
                            tagsIds: tags.map((tag) => tag.id),
                        });
                    }
                } else {
                    const tag = new Tag({
                        name: this.tagsCtrl.value,
                        author: this.user.id,
                    });
                    tag.id = await this.tagService.createTagDuringEditingTask(tag);
                    tags.push(tag);
                    if (!this.isNewTask()) {
                        this.store.dispatch(
                            requestUpdateTask({
                                task: {
                                    id: this.task.id,
                                    changes: Object.assign({}, this.task, {
                                        tags: tags,
                                        tagsIds: tags.map((t) => t.id),
                                    }),
                                },
                            }),
                        );
                    } else {
                        this.task = Object.assign({}, this.task, {
                            tags: tags,
                            tagsIds: tags.map((t) => t.id),
                        });
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
        console.log({ values });
        const updatedTask = Object.assign({}, this.task);
        if (this.taskForm.valid) {
            const selectedTaskProject = this.projects.find((project) => project.id === values["main"]["taskProjectPk"]);
            updatedTask.name = values["main"]["name"];
            updatedTask.richName = addClickableLinks(values["main"]["name"]);
            updatedTask.priority = values["main"]["priority"];
            updatedTask.description = values["extra"]["description"];
            updatedTask.taskType = values["main"]["taskType"];
            updatedTask.richDescription = addClickableLinks(values["extra"]["description"]);
            updatedTask.finishDate = values["main"]["finishDate"] ? values["main"]["finishDate"] : null;
            updatedTask.finishTime = values["main"]["finishTime"] ? values["main"]["finishTime"] : "";
            updatedTask.suspendDate = values["extra"]["suspendedDate"] ? moment(values["extra"]["suspendedDate"], "DD-MM-YYYY") : "";
            updatedTask.typeFinishDate = values["main"]["typeFinishDate"];
            updatedTask.taskProject = new TaskProject({
                id: selectedTaskProject.id,
                shareWithIds: selectedTaskProject.shareWithIds,
                color: selectedTaskProject.color,
                name: selectedTaskProject.name,
                icon: selectedTaskProject.icon,
            });
            const user = <ShareWithUser>selectedTaskProject.shareWith.find((sharedUser) => sharedUser["id"] === values["extra"]["ownerId"]);
            updatedTask.owner = new TaskUser(<ITaskUser>{
                id: user.id,
                avatarUrl: user.avatarUrl,
                email: user.email,
                username: user.username,
            });

            if (values["repeat"]["repeatDefault"] !== 99) {
                updatedTask.repeat = values["repeat"]["repeatDefault"];
                updatedTask.repeatDelta = 1;
            } else {
                updatedTask.repeatDelta = values["repeat"]["repeatDelta"];
                updatedTask.repeat = values["repeat"]["repeatCustom"];
            }
            updatedTask.onHold = values["extra"]["suspended"];

            updatedTask.fromRepeating = values["repeat"]["fromRepeating"];
            updatedTask.estimateTime = changeTimeStringFormatToValue(values["extra"]["estimateTime"]);
            updatedTask.time = changeTimeStringFormatToValue(values["extra"]["time"]);
            // We need to know which step will be deleted in the backend
            updatedTask.steps = this.task.steps.filter((step) => step.delete);
            values["steps"].forEach((step, index) => {
                if (step.name !== "") {
                    updatedTask.steps.push(
                        new Step({
                            id: step.id,
                            name: step.name,
                            order: index,
                            status: step.status,
                        }),
                    );
                }
            });
            if (this.isNewTask()) {
                this.store.dispatch(requestCreateTask({ task: updatedTask }));
            } else {
                this.store.dispatch(
                    requestUpdateTask({
                        task: { id: updatedTask.id, changes: updatedTask },
                    }),
                );
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

    getSelectedTaskType() {
        return this.taskTypesWithIcons.find((taskType) => taskType.value === this.taskForm.get("main").get("taskType").value);
    }

    close(): void {
        // DRY
        this.location.back();
    }

    getErrorMessage(field: AbstractControl): string {
        return field.hasError("maxLength") ? "Name is too long" : field.hasError("required") ? "You have to add task name" : "";
    }

    hasErrorMessage(field: AbstractControl): boolean {
        return field.hasError("maxLength") || field.hasError("required");
    }

    initSteps(steps: Step[]) {
        const array = [];
        steps
            .filter((step) => !step.delete)
            .forEach((step: Step) => {
                array.push(
                    this.fb.group({
                        name: [step.name, Validators.required],
                        id: [step.id, Validators.required],
                        status: [step.status, Validators.required],
                    }),
                );
            });
        array.push(this.initStep());

        return this.fb.array(array);
    }

    initStep() {
        return this.fb.group({
            name: [""],
            id: [createUniqueId()],
            status: [0],
        });
    }

    addNewStep() {
        const control = <UntypedFormArray>this.taskForm.controls["steps"];
        control.push(this.initStep());
    }

    removeStep(i: number) {
        const control = <UntypedFormArray>this.taskForm.controls["steps"];
        // delete steps from task model
        const steps = [...this.task.steps];
        if (control.controls[i].value.id) {
            steps.map((step) => {
                const updatedStep = { ...step };
                if (updatedStep.id === control.controls[i].value.id) {
                    updatedStep.delete = true;
                }
                return updatedStep;
            });
        }
        control.removeAt(i);
        this.task = Object.assign({}, this.task, { steps: steps });
    }

    changeProjectInTask(event): void {
        const newProject = this.projects.find((project) => project.id === event.value);
        this.task = Object.assign({}, this.task, {
            taskProject: new TaskProject(this.projects.find((project) => project.id === event.value)),
        });
        const extra = <UntypedFormGroup>this.taskForm.controls["extra"];
        extra.controls["ownerId"].setValue(this.user.id);
        this.selectedProject = newProject;
    }

    createAndAddMore($event, values): void {
        this.onSubmit(values, true);
        this.task = this.createNewTask(this.selectedProject);
        this.taskForm.reset();
        this.taskForm = this.createTaskForm(this.task);
        this.changeActiveItemInMenu("main");
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
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((result) => {
                if (result) {
                    this.store.dispatch(deleteTask({ taskId: this.task.id }));
                    this.close();
                }
            });
    }

    isNewTask(): boolean {
        return !this.task.id;
    }

    drop(event: CdkDragDrop<string[]>) {
        const stepsArray = this.taskForm.get("steps") as UntypedFormArray;
        const fromIndex = event.previousIndex;
        const toIndex = event.currentIndex;

        const movedFormGroup = stepsArray.at(fromIndex) as FormGroup;

        stepsArray.removeAt(fromIndex);
        stepsArray.insert(toIndex, movedFormGroup);
        // moveItemInArray(stepsArray["controls"], event.previousIndex, event.currentIndex);
    }

    private finishTimeWithFinishDate() {
        return null;
    }

    private createFinishDateFilter() {
        if (!this.task.finishDate || this.task.finishDate >= this.minDate) {
            this.minFilter = (d: Date): boolean => this.minDate.setHours(0, 0, 0, 0) <= d?.setHours(0, 0, 0, 0);
        } else {
            this.minFilter = (): boolean => true;
        }
    }
}
