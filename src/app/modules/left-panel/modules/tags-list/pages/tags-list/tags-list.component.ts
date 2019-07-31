import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {TagService} from '../../../../../../core/services/tag.service';
import {Tag} from '../../../../../../models/tags';
import {Task} from '../../../../../../models/tasks';
import {TaskService} from '../../../../../../core/services/task.service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {UserService} from '../../../../../../core/services/user.service';
import {User} from '../../../../../../core/models';
import {ConfigurationService} from '../../../../../../services/configuration.service';
import {FilterTagsDialogComponent} from '../../components/filter-tags-dialog/filter-tags-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {TagsFiltersService} from '../../../../../../services/tags-filters.service';
import {TasksFiltersService} from '../../../../../../core/services/tasks-filters.service';
import {AppStore} from '../../../../../../store';
import {Store} from '@ngrx/store';
import {takeUntil} from 'rxjs/operators';
import {RequestCreateTag} from '../../../../../../core/actions/tags.actions';
import {selectFilteredTagsList} from '../../tags-filters.selectors';
import {HttpClient} from '@angular/common/http';
import {AngularFireAuth} from '@angular/fire/auth';

@Component({
    selector: 'tickist-tags-list',
    templateUrl: './tags-list.component.html',
    styleUrls: ['./tags-list.component.scss']
})
export class TagsListComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    tags: Tag[];
    tasks: Task[];
    user: User;
    createTagForm: FormGroup;
    defaultTaskView: string;
    taskView: string;
    filteredTagsList$: Observable<Tag[]>;

    constructor(private fb: FormBuilder, private tagService: TagService, private  taskService: TaskService,
                private userService: UserService, private configurationService: ConfigurationService,
                public dialog: MatDialog, private authFire: AngularFireAuth,
                private tasksFiltersService: TasksFiltersService, private store: Store<AppStore>) {

    }

    ngOnInit(): void {
        this.filteredTagsList$ = this.store.select(selectFilteredTagsList);
        this.createTagForm = new FormGroup({
            'name': new FormControl('', Validators.required)
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        // clearTimeout(this.timer);
    }

    createTag(values): void {
        if (this.createTagForm.valid) {
            const newTag = new Tag(<any> {name: values['name'], author: this.authFire.auth.currentUser.uid});
            this.store.dispatch(new RequestCreateTag({tag: newTag}));
            this.createTagForm.reset();
        }

    }

    trackByFn(index, item): number {
        return item.id;
    }

    openFilterDialog(): void {
        const dialogRef = this.dialog.open(FilterTagsDialogComponent);
        dialogRef.afterClosed()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(result => {
                if (result) {

                }
            });
    }

}
