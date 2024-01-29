import {Component, OnDestroy, OnInit} from '@angular/core';
import {Tag} from '@data/tags/models/tags';
import { MatDialogRef, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import {TagService} from '../../core/services/tag.service';
import {TasksFiltersService} from '../../core/services/tasks-filters.service';
import {Store} from '@ngrx/store';
import {selectCurrentTagsFilter} from '../../core/selectors/filters-tasks.selectors';
import {Observable, Subject} from 'rxjs';
import {selectAllTags} from '../../core/selectors/tags.selectors';
import {Filter} from '@data/filter';
import {takeUntil} from 'rxjs/operators';
import {setCurrentTagsFilters} from "../../core/actions/tasks/tags-filters-tasks.actions";
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatChipsModule } from '@angular/material/chips';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'tickist-tags-filter-dialog',
    templateUrl: './tags-filter-dialog.html',
    styleUrls: ['./tags-filter-dialog.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, MatDialogContent, NgIf, MatChipsModule, FaIconComponent, NgFor]
})
export class TagsFilterDialogComponent implements OnInit, OnDestroy {
    tagsFilterValue: any;
    tagsCurrentFilter$: Observable<Filter>;
    tagsFilterValueId: any;
    tags: Tag[] = [];
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public dialogRef: MatDialogRef<TagsFilterDialogComponent>, public tagService: TagService,
                private tasksFiltersService: TasksFiltersService, private store: Store) {
    }

    ngOnInit(): void {
        this.tagsCurrentFilter$ = this.store.select(selectCurrentTagsFilter);

        this.tagsCurrentFilter$.pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((filter: Filter) => {
            this.tagsFilterValueId = filter.id;
            this.tagsFilterValue = filter;
        });

        this.store.select(selectAllTags).pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((tags) => {
            this.tags = tags;
        });
    }

    changeSelectedTags(tag: Tag | string) {
        let value, name;
        if (tag instanceof Tag) {
            value =  [tag.id];
            name = tag.name;
        } else  {
            value = tag;
            name = tag;
        }
        const newFilter = new Filter({'id': 1, 'label': 'tags', value, name});
        this.store.dispatch(setCurrentTagsFilters({currentTagsFilter: newFilter}));
        this.dialogRef.close();
    }

    isActive(tagId: any) {
        return Array.isArray(this.tagsFilterValue.value) ? new Set(this.tagsFilterValue.value).has(tagId) : false
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
