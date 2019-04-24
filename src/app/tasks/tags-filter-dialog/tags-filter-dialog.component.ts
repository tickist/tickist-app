import {Component, OnInit} from '@angular/core';
import {Tag} from '../../models/tags';
import {MatDialogRef} from '@angular/material';
import {TaskService} from '../../core/services/task.service';
import {TagService} from '../../services/tag.service';
import {TasksFiltersService} from '../../core/services/tasks-filters.service';
import {SetCurrentTagsFilters} from '../../core/actions/tasks/tags-filters-tasks.actions';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {Filter} from '../../models/filter';
import {selectCurrentTagsFilter} from '../../core/selectors/filters-tasks.selectors';
import {Observable, Subject} from 'rxjs';
import {selectAllTags} from '../../core/selectors/tags.selectors';

@Component({
    selector: 'tags-filter-dialog',
    templateUrl: './tags-filter-dialog.html'
})
export class TagsFilterDialogComponent implements OnInit {
    tagsFilterValue: any;
    tagsCurrentFilter$: Observable<Filter>;
    tagsFilterValueId: any;
    tags: Tag[] = [];
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public dialogRef: MatDialogRef<TagsFilterDialogComponent>, public tagService: TagService,
                private tasksFiltersService: TasksFiltersService, private store: Store<AppStore>) {
    }

    ngOnInit(): void {
        this.tagsCurrentFilter$ = this.store.select(selectCurrentTagsFilter);

        this.tagsCurrentFilter$.subscribe((filter: Filter) => {
            this.tagsFilterValueId = filter.id;
        });

        this.store.select(selectAllTags).subscribe((tags) => {
            this.tags = tags;
        });
    }

    changeSelectedTags(tagId: any) {
        let value;
        if (tagId instanceof String || typeof tagId === 'string') {
            value = tagId;
        } else if (Number.isInteger(tagId)) {
            value = [tagId];
        }
        const newFilter = new Filter({'id': 1, 'label': 'tags', 'value': value});
        this.store.dispatch(new SetCurrentTagsFilters({currentTagsFilter: newFilter}));
        this.dialogRef.close();
    }

    isActive(tagId: any) {
        return this.tagsFilterValue === tagId;
    }

}
