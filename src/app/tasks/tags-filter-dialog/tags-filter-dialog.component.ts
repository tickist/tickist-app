import {Component} from '@angular/core';
import {Tag} from '../../models/tags';
import {MatDialogRef} from '@angular/material';
import {TaskService} from '../../services/task.service';
import {TagService} from '../../services/tag.service';
import {TasksFiltersService} from '../../services/tasks-filters.service';

@Component({
    selector: 'tags-filter-dialog',
    templateUrl: './tags-filter-dialog.html'
})
export class TagsFilterDialogComponent {
    tagsFilterValue: any;
    tagsFilterValues: any;
    tagsFilterValueId: any;
    tags: Tag[] = [];

    constructor(public dialogRef: MatDialogRef<TagsFilterDialogComponent>, public taskService: TaskService,
                public tagService: TagService, private tasksFiltersService: TasksFiltersService) {
        this.tasksFiltersService.currentTasksFilters$.subscribe((filters) => {
            if (filters.length > 0) {
                this.tagsFilterValue = filters.filter(filter => filter.label == 'tags')[0];
                this.tagsFilterValueId = this.tagsFilterValue['id'];
            }
        });

        this.tasksFiltersService.tasksFilters$.subscribe((filters) => {
            if (filters.length > 0) {
                this.tagsFilterValues = filters.filter(filter => filter.label === 'tags');
            }
        });

        this.tagService.tags$.subscribe((tags) => {
            this.tags = tags;
        })
    }

    private isInt(value) {
        // @TODO DRY
        return !isNaN(value) && (function (x) {
            return (x | 0) === x;
        })(parseFloat(value))
    }

    changeSelectedTags(tagId: any) {
        let value;
        if (tagId instanceof String || typeof tagId === 'string') {
            value = tagId;
        } else if (this.isInt(tagId)) {
            value = [tagId];
        }
        this.tasksFiltersService.updateCurrentFilter({'id': 1, 'label': 'tags', 'value': value});
        this.dialogRef.close();
    }

    isActive(tagId: any) {
        return this.tagsFilterValue === tagId;
    }

}
