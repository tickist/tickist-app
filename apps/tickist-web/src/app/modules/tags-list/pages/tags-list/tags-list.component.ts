import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { TagService } from "../../../../core/services/tag.service";
import { Tag } from "@data/tags/models/tags";
import { Task } from "@data/tasks/models/tasks";
import { TaskService } from "../../../../core/services/task.service";
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { UserService } from "../../../../core/services/user.service";
import { User } from "@data/users/models";
import { ConfigurationService } from "../../../../core/services/configuration.service";
import { FilterTagsDialogComponent } from "../../components/filter-tags-dialog/filter-tags-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { TasksFiltersService } from "../../../../core/services/tasks-filters.service";
import { Store } from "@ngrx/store";
import { takeUntil } from "rxjs/operators";
import { requestCreateTag } from "../../../../core/actions/tags.actions";
import { selectFilteredTagsList } from "../../tags-filters.selectors";
import { Auth } from "@angular/fire/auth";
import { TagWithTaskCounter } from "@data/tags/models/tag-with-task-counter";
import { selectLoggedInUser } from "../../../../core/selectors/user.selectors";
import { DataCyDirective } from "../../../../shared/directives/data-cy.directive";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NgFor, NgStyle, NgIf, AsyncPipe } from "@angular/common";
import { TagComponent } from "../../components/tag/tag.component";
import { MenuButtonComponent } from "../../../../shared/components/menu-button/menu-button.component";
import { FlexModule } from "@ngbracket/ngx-layout/flex";

@Component({
    selector: "tickist-tags-list",
    templateUrl: "./tags-list.component.html",
    styleUrls: ["./tags-list.component.scss"],
    standalone: true,
    imports: [
        FlexModule,
        MenuButtonComponent,
        TagComponent,
        NgFor,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        NgStyle,
        ExtendedModule,
        MatInputModule,
        NgIf,
        MatButtonModule,
        DataCyDirective,
        AsyncPipe,
    ],
})
export class TagsListComponent implements OnInit, OnDestroy {
    @ViewChild("form", { static: true }) createTagFormDOM;
    tags: Tag[];
    tasks: Task[];
    user: User;
    createTagForm: UntypedFormGroup;
    defaultTaskView: string;
    taskView: string;
    filteredTagsList$: Observable<TagWithTaskCounter[]>;

    private ngUnsubscribe: Subject<void> = new Subject<void>();
    constructor(
        private fb: UntypedFormBuilder,
        private tagService: TagService,
        private taskService: TaskService,
        private userService: UserService,
        private configurationService: ConfigurationService,
        public dialog: MatDialog,
        private authFire: Auth,
        private tasksFiltersService: TasksFiltersService,
        private store: Store
    ) {}

    ngOnInit(): void {
        this.filteredTagsList$ = this.store.select(selectFilteredTagsList);
        this.createTagForm = new UntypedFormGroup({
            name: new UntypedFormControl("", Validators.required),
        });
        this.store
            .select(selectLoggedInUser)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((user) => (this.user = user));
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        // clearTimeout(this.timer);
    }

    createTag(values): void {
        if (this.createTagForm.valid) {
            const newTag = new Tag(<any>{
                name: values["name"],
                author: this.user.id,
            });
            this.store.dispatch(requestCreateTag({ tag: newTag }));
            this.createTagForm.reset();
            this.createTagFormDOM.resetForm();
        }
    }

    trackByFn(index, item): number {
        return item.id;
    }

    openFilterDialog(): void {
        const dialogRef = this.dialog.open(FilterTagsDialogComponent);
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((result) => {
                if (result) {
                }
            });
    }
}
