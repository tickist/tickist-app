import {
    AfterViewInit,
    ChangeDetectionStrategy,
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
import {
    DEFAULT_PROJECT_ICON,
    removeTagsNotBelongingToUser,
    ShareWithUser,
    Tag,
    Task,
    TaskProject,
    TaskType,
    User,
} from "@data";
import { Observable, Subject } from "rxjs";
import { RepeatStringExtension } from "../../shared/pipes/repeatStringExtension";
import { takeUntil } from "rxjs/operators";
import { SingleTask2Component } from "../shared/single-task";
import {
    repairAvatarUrl,
    requestUpdateTask,
} from "../../core/actions/tasks/task.actions";
import { Store } from "@ngrx/store";
import { removeTag } from "../utils/task-utils";
import { selectAllProjectLeftPanel } from "../../modules/projects-list/projects-filters.selectors";
import { selectProjectById } from "../../core/selectors/projects.selectors";
import { FormControl } from "@angular/forms";
import { AngularFireAuth } from "@angular/fire/auth";
import { ProjectLeftPanel } from "../../modules/projects-list/models/project-list";

@Component({
    selector: "tickist-single-task-extended",
    templateUrl: "./single-task-extended.component.html",
    styleUrls: ["./single-task-extended.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleTaskExtendedComponent
    extends SingleTask2Component
    implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
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
        private fireAuth: AngularFireAuth
    ) {
        super(store, dialog);
        this.repeatStringExtension = new RepeatStringExtension(
            this.configurationService
        );
    }

    ngOnInit() {
        this.selectTaskProject = new FormControl(this.task.taskProject.id);
        this.projects$ = this.store.select(selectAllProjectLeftPanel);
        this.projects$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((projects) => (this.projects = projects));
        if (this.mediaChange && this.mediaChange.mqAlias === "xs") {
            this.dateFormat = "dd-MM";
        }
        const repeatDelta = this.task.repeatDelta;
        const repeatDeltaExtension = this.repeatStringExtension.transform(
            this.task.repeat
        );
        this.repeatString = `every ${repeatDelta} ${repeatDeltaExtension}`;
        this.amountOfStepsDoneInPercent =
            (this.task.steps.filter((step) => step.status === 1).length * 100) /
            this.task.steps.length;
        this.selectTaskProject.valueChanges
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((value) => {
                this.store
                    .select(selectProjectById(value))
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
                    });
            });
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
        const selectedTaskProject = this.projects.find(
            (project) => project.id === this.task.taskProject.id
        );
        this.task.owner = <ShareWithUser>(
            selectedTaskProject.shareWith.find(
                (user) => user.id && (<ShareWithUser>user).id === event.value
            )
        );
        this.store.dispatch(
            requestUpdateTask({
                task: { id: this.task.id, changes: this.task },
            })
        );
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
            this.icon = this.task.taskProject?.icon
                ? this.task.taskProject.icon[1]
                : DEFAULT_PROJECT_ICON[1];
            this.iconPrefix = this.task.taskProject?.icon
                ? this.task.taskProject.icon[0]
                : DEFAULT_PROJECT_ICON[0];
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
            this.selectTaskProject.setValue(
                changes.task.currentValue.taskProject.id,
                { emitEvent: false }
            );
        }
        if (changes?.task?.currentValue && this.user) {
            this.tags = removeTagsNotBelongingToUser(
                this.task.tags,
                this.user.id
            );
        }
        this.isTaskTypeLabelVisible =
            this.task.taskType === TaskType.needInfo ||
            this.task.taskType === TaskType.nextAction;
    }

    changeFastMenuVisible(value) {
        this.isFastMenuVisible = value;
        this.changeRightMenuVisiblity();
    }

    repairAvatarUrl() {
        this.store.dispatch(repairAvatarUrl({ task: this.task }));
    }
}
