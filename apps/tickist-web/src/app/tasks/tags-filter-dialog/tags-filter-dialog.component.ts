import {Component, OnDestroy, OnInit} from '@angular/core';
import {Tag} from '@data/tags/models/tags';
import {MatDialogRef} from '@angular/material/dialog';
import {TagService} from '../../core/services/tag.service';
import {TasksFiltersService} from '../../core/services/tasks-filters.service';
import {SetCurrentTagsFilters} from '../../core/actions/tasks/tags-filters-tasks.actions';
import {Store} from '@ngrx/store';
import {selectCurrentTagsFilter} from '../../core/selectors/filters-tasks.selectors';
import {Observable, Subject} from 'rxjs';
import {selectAllTags} from '../../core/selectors/tags.selectors';
import {Filter} from '@data/filter';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'tickist-tags-filter-dialog',
    templateUrl: './tags-filter-dialog.html'
})
export class TagsFilterDialogComponent implements OnInit, OnDestroy {
    tagsFilterValue: any;
    tagsCurrentFilter$: Observable<Filter>;
    tagsFilterValueId: any;
    tags: Tag[] = [];
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public dialogRef: MatDialogRef<TagsFilterDialogComponent>, public tagService: TagService,
                private tasksFiltersService: TasksFiltersService, private store: Store<{}>) {
    }

    ngOnInit(): void {
        this.tagsCurrentFilter$ = this.store.select(selectCurrentTagsFilter);

        this.tagsCurrentFilter$.pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((filter: Filter) => {
            this.tagsFilterValueId = filter.id;
        });

        this.store.select(selectAllTags).pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((tags) => {
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

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
