import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Renderer2,
    SimpleChange,
    ViewChild,
} from "@angular/core";
import { TaskService } from "../../core/services/task.service";
import { ConfigurationService } from "../../core/services/configuration.service";
import { MatDialog } from "@angular/material/dialog";
import { ProjectService } from "../../core/services/project.service";
import { DEFAULT_PROJECT_ICON, Project, removeTagsNotBelongingToUser, ShareWithUser, Tag, Task, TaskProject, TaskType, User } from "@data";
import { Observable, Subject } from "rxjs";
import { RepeatStringExtension } from "../../shared/pipes/repeatStringExtension";
import { filter, map, startWith, takeUntil, withLatestFrom } from "rxjs/operators";
import { SingleTask2Component } from "../shared/single-task";
import { repairAvatarUrl, requestUpdateTask } from "../../core/actions/tasks/task.actions";
import { Store } from "@ngrx/store";
import { removeTag } from "../utils/task-utils";
import { selectAllProjectLeftPanel } from "../../modules/projects-list/projects-filters.selectors";
import { selectProjectByIdOrName } from "../../core/selectors/projects.selectors";
import { FormControl, UntypedFormControl } from "@angular/forms";
import { ProjectLeftPanel } from "../../modules/projects-list/models/project-list";
import { forbiddenNamesValidator } from "../utils/forbidden-name-validator";
import {MatAutocompleteSelectedEvent, MatAutocompleteTrigger} from "@angular/material/autocomplete";
import { MyErrorStateMatcher } from "../../shared/error-state-matcher";

@Component({
    selector: "tickist-single-task-extended",
    templateUrl: "./single-task-extended.component.html",
    styleUrls: ["./single-task-extended.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleTaskExtendedComponent extends SingleTask2Component implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    @Input() task: Task;
    @Input() user: User;
    @Input() mediaChange;
    @ViewChild("container", { static: true }) container: ElementRef;
    isArchive = false;
    dateFormat = "dd-MM-yyyy";
    projects$: Observable<ProjectLeftPanel[]>;
    projects: ProjectLeftPanel[];
    ngUnsubscribe: Subject<void> = new Subject<void>();
    repeatString = "";
    repeatStringExtension;
    selectTaskProject: FormControl;
    tags: Tag[] = [];
    isTaskTypeLabelVisible = false;
    icon: string;
    iconPrefix: string;
    filteredProjects$: Observable<ProjectLeftPanel[]>;
    matcher = new MyErrorStateMatcher();
    @ViewChild(MatAutocompleteTrigger, {read: MatAutocompleteTrigger}) inputAutoComplete: MatAutocompleteTrigger;

    @HostListener("mouseenter")
    onMouseEnter() {
        this.isMouseOver = true;
        this.changeRightMenuVisiblity();
        this.isRightMenuVisible = true;
    }

    @HostListener("mouseleave")
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

    constructor(
        private taskService: TaskService,
        private configurationService: ConfigurationService,
        public dialog: MatDialog,
        private projectService: ProjectService,
        private renderer: Renderer2,
        public store: Store,
        private cd: ChangeDetectorRef
    ) {
        super(store, dialog);
        this.repeatStringExtension = new RepeatStringExtension(this.configurationService);
        this.selectTaskProject = new FormControl<string | Project>("", { updateOn: "change" });
    }

    ngOnInit() {
        this.projects$ = this.store.select(selectAllProjectLeftPanel);
        this.projects$
            .pipe(
                takeUntil(this.ngUnsubscribe),
                filter((projects) => projects.length > 0)
            )
            .subscribe((projects) => {
                this.projects = projects;
                this.selectTaskProject.addValidators([forbiddenNamesValidator(projects)]);
                this.filteredProjects$ = this.selectTaskProject.valueChanges.pipe(
                    startWith(""),
                    map(([value]) => {
                        const name = typeof value === "string" ? value : value?.name;
                        return name ? projects.filter((project) => project.name.toLowerCase().includes(name.toLowerCase())) : projects;
                    })
                );
            });

        if (this.mediaChange && this.mediaChange.mqAlias === "xs") {
            this.dateFormat = "dd-MM";
        }
        const repeatDelta = this.task.repeatDelta;
        const repeatDeltaExtension = this.repeatStringExtension.transform(this.task.repeat);
        this.repeatString = `every ${repeatDelta} ${repeatDeltaExtension}`;
        this.amountOfStepsDoneInPercent = (this.task.steps.filter((step) => step.status === 1).length * 100) / this.task.steps.length;
        // this.selectTaskProject.valueChanges
        //     .pipe(takeUntil(this.ngUnsubscribe))
        //     .subscribe((value) => {
        //         debugger;
        //         this.store
        //             .select(selectProjectById(value))
        //             .pipe(takeUntil(this.ngUnsubscribe))
        //             .subscribe((project) => {
        //                 const task = Object.assign({}, this.task, {
        //                     taskProject: new TaskProject({
        //                         name: project.name,
        //                         color: project.color,
        //                         shareWithIds: project.shareWithIds,
        //                         id: project.id,
        //                         icon: project.icon,
        //                     }),
        //                 });
        //                 this.store.dispatch(
        //                     requestUpdateTask({
        //                         task: { id: this.task.id, changes: task },
        //                     })
        //                 );
        //             });
        //     });
    }

    changeProject(event: MatAutocompleteSelectedEvent | KeyboardEvent) {
        let value: string;
        if (event instanceof MatAutocompleteSelectedEvent) {
            value = event?.option.value;
        } else if (event instanceof KeyboardEvent) {
            value = (event.target as HTMLInputElement).value.trim();
        } else {
            return;
        }
        if (this.selectTaskProject.valid) {
            this.store
                .select(selectProjectByIdOrName(value))
                .pipe(takeUntil(this.ngUnsubscribe))
                .subscribe((project) => {
                    const task = Object.assign({}, this.task, {
                        taskProject: new TaskProject({
                            name: project.name,
                            color: project.color,
                            shareWithIds: project.shareWithIds,
                            id: project.id,
                            icon: project.icon,
                        }),
                    });
                    this.store.dispatch(
                        requestUpdateTask({
                            task: { id: this.task.id, changes: task },
                        })
                    );
                    this.selectTaskProject.setValue(value, { emitEvent: false });
                    this.selectTaskProject.setErrors(null);
                    this.inputAutoComplete.closePanel();
                    // this.auto.closePanel();
                });
        }
    }

    ngAfterViewInit() {
        this.renderer.addClass(this.container.nativeElement, "flow");
        this.renderer.addClass(this.container.nativeElement, "row");
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        super.ngOnDestroy();
    }

    changeAssignedTo(event) {
        const selectedTaskProject = this.projects.find((project) => project.id === this.task.taskProject.id);
        this.task.owner = <ShareWithUser>selectedTaskProject.shareWith.find((user) => user.id && (<ShareWithUser>user).id === event.value);
        this.store.dispatch(
            requestUpdateTask({
                task: { id: this.task.id, changes: this.task },
            })
        );
        // this.taskService.updateTask(this.task, true, true);
    }

    displayFn(project: Project): string {
        return project?.name ? project.name : "";
    }

    removeTag(tag) {
        this.task = removeTag(this.task, tag);
        this.store.dispatch(
            requestUpdateTask({
                task: { id: this.task.id, changes: this.task },
            })
        );
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        this.isArchive = this.task.isDone;

        if (changes.task) {
            this.icon = this.task.taskProject?.icon ? this.task.taskProject.icon[1] : DEFAULT_PROJECT_ICON[1];
            this.iconPrefix = this.task.taskProject?.icon ? this.task.taskProject.icon[0] : DEFAULT_PROJECT_ICON[0];
        }

        if (
            changes?.mediaChange?.currentValue &&
            changes["mediaChange"].currentValue &&
            changes["mediaChange"].currentValue.mqAlias === "xs"
        ) {
            this.dateFormat = "dd-MM";
        } else {
            this.dateFormat = "dd-MM-yyyy";
        }
        if (changes?.task?.currentValue && this.selectTaskProject) {
            this.selectTaskProject.setValue({ name: changes.task.currentValue.taskProject.name }, { emitEvent: false });
        }
        if (changes?.task?.currentValue && this.user) {
            this.tags = removeTagsNotBelongingToUser(this.task.tags, this.user.id);
        }
        this.isTaskTypeLabelVisible = this.task.taskType === TaskType.needInfo || this.task.taskType === TaskType.nextAction;
    }

    changeFastMenuVisible(value) {
        this.isFastMenuVisible = value;
        this.changeRightMenuVisiblity();
    }

    repairAvatarUrl() {
        this.store.dispatch(repairAvatarUrl({ task: this.task }));
    }
}
