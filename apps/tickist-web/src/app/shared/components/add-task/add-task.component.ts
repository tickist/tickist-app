import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Project, Task, TaskProject, TaskUser, User } from "@data";
import { Subject } from "rxjs";
import { UntypedFormControl, UntypedFormGroup, FormGroupDirective, Validators } from "@angular/forms";
import { selectLoggedInUser } from "../../../core/selectors/user.selectors";
import { takeUntil } from "rxjs/operators";
import { Store } from "@ngrx/store";
import { requestCreateTask } from "../../../core/actions/tasks/task.actions";
import { ShowOnDirtyErrorStateMatcher } from "@angular/material/core";
import { addTaskInputIsFocus } from "../../../core/selectors/ui.selectors";
import { blurOnAddTaskInput } from "../../../core/actions/ui.actions";

@Component({
    selector: "tickist-add-task",
    templateUrl: "./add-task.component.html",
    styleUrls: ["./add-task.component.scss"],
})
export class AddTaskComponent implements OnInit, OnDestroy, OnChanges {
    @Input() project: Project;
    @Input() enableLastElement = false;
    @ViewChild("addTaskInput", { static: false }) addTaskInput: ElementRef;

    createTaskForm: UntypedFormGroup;
    user: User;
    showCreateTaskForm = false;
    submitted = false;
    matcher = new ShowOnDirtyErrorStateMatcher();

    private ngUnsubscribe: Subject<void> = new Subject<void>();
    constructor(private store: Store) {
        this.createTaskForm = new UntypedFormGroup({
            name: new UntypedFormControl("", Validators.required),
        });
    }

    ngOnInit(): void {
        this.store
            .select(selectLoggedInUser)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((user) => {
                this.user = user;
            });
        this.store
            .select(addTaskInputIsFocus)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((isFocus) => {
                if (isFocus) {
                    this.addTaskInput.nativeElement.focus();
                    this.store.dispatch(blurOnAddTaskInput());
                }
            });
    }

    ngOnChanges() {
        this.showCreateTaskForm = !!this.project;
    }

    createTask(values, formDirective: FormGroupDirective) {
        this.submitted = true;
        if (this.createTaskForm.valid) {
            Object.keys(this.createTaskForm.controls).forEach((key) => {
                this.createTaskForm.get(key).setErrors(null);
            });
            this.createTaskForm.reset();
            formDirective.resetForm();
            this.store.dispatch(requestCreateTask({ task: this.createTaskModel(values.name) }));
        } else {
            this.submitted = false;
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    private createTaskModel(taskName: string) {
        return new Task(<any>{
            name: taskName,
            priority: this.project.defaultPriority,
            description: "",
            finishDate: "",
            finishTime: "",
            suspendDate: "",
            repeat: 0,
            owner: new TaskUser(this.user),
            ownerPk: this.user.id,
            author: new TaskUser(this.user),
            repeatDelta: 1,
            fromRepeating: 0,
            taskProject: new TaskProject(this.project),
            estimateTime: 0,
            taskListPk: this.project.id,
            time: undefined,
            steps: [],
            tags: [],
        });
    }
}
