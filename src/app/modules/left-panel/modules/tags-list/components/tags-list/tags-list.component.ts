import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription, combineLatest, Subject} from 'rxjs';
import {TagService} from '../../../../../../services/tag.service';
import {Tag} from '../../../../../../models/tags';
import {Task} from '../../../../../../models/tasks';
import {TaskService} from '../../../../../../core/services/task.service';
import {FormBuilder, Validators, FormGroup, FormControl} from '@angular/forms';
import {UserService} from '../../../../../../core/services/user.service';
import {User} from '../../../../../../core/models';
import {ConfigurationService} from '../../../../../../services/configuration.service';
import {FilterTagsDialogComponent} from '../filter-tags-dialog/filter-tags-dialog.component';
import {MatDialog} from '@angular/material';
import {TagsFiltersService} from '../../../../../../services/tags-filters.service';
import {Filter} from '../../../../../../models/filter';
import {TasksFiltersService} from '../../../../../../core/services/tasks-filters.service';
import * as _ from 'lodash';
import {AppStore} from '../../../../../../store';
import {Store} from '@ngrx/store';
import {selectAllTags} from '../../../../../../core/selectors/tags.selectors';
import {takeUntil} from 'rxjs/operators';
import {selectLoggedInUser} from '../../../../../../core/selectors/user.selectors';
import {RequestCreateTag} from '../../../../../../core/actions/tags.actions';
import {selectFilteredTagsList} from '../../tags-filters.selectors';

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
                protected userService: UserService, protected configurationService: ConfigurationService,
                public dialog: MatDialog, protected tagsFiltersService: TagsFiltersService,
                protected tasksFiltersService: TasksFiltersService, private store: Store<AppStore>) {

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
            const newTag = new Tag({name: values['name']});
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
