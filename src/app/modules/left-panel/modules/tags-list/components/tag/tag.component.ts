import {Component, OnInit, Input, ViewContainerRef} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TagService} from '../../../../../../core/services/tag.service';
import {Tag} from '../../../../../../models/tags';
import {TasksFiltersService} from '../../../../../../core/services/tasks-filters.service';
import {Filter} from '../../../../../../models/filter';
import {DeleteTag, RequestDeleteTag, RequestUpdateTag, UpdateTag} from '../../../../../../core/actions/tags.actions';
import {Store} from '@ngrx/store';
import {AppStore} from '../../../../../../store';
import {SetCurrentTagsFilters} from '../../../../../../core/actions/tasks/tags-filters-tasks.actions';
import {selectCurrentTagsFilter} from '../../../../../../core/selectors/filters-tasks.selectors';


@Component({
    selector: 'app-tag',
    templateUrl: './tag.component.html',
    styleUrls: ['./tag.component.scss']
})
export class TagComponent implements OnInit {
    @Input() label: string;
    @Input() id: string | number;
    @Input() tasksCounter: number;
    @Input() tag?: Tag;
    tagsIds: string | Set<number | string>;
    isActive: boolean;
    isChecked: boolean;
    editTagForm: FormGroup;
    editMode = false;
    isCheckboxModeEnabled = false;

    constructor(private fb: FormBuilder, private tasksFiltersService: TasksFiltersService, private store: Store<AppStore>) {
        this.isActive = false;
    }

    ngOnInit() {
        this.store.select(selectCurrentTagsFilter).subscribe((filter) => {
            if (!filter) return;
            if (filter.value instanceof Array) {
                this.tagsIds = new Set(filter.value);
            } else {
                this.tagsIds = filter.value;
            }
            this.isActive = ((this.tagsIds instanceof Set && this.tagsIds.has(<number>this.id)) || this.tagsIds === this.id);
            this.isChecked = ((this.tagsIds instanceof Set && this.tagsIds.has(<number>this.id)) || this.tagsIds === this.id);
            this.isCheckboxModeEnabled = this.isInt(this.id) && (this.tagsIds instanceof Set) && this.tagsIds.size > 0;
        });
        this.editTagForm = new FormGroup({
            'name': new FormControl(this.label, Validators.required)
        });
    }

    editTag(values) {
        const tag = JSON.parse(JSON.stringify(this.tag));
        tag.name = values['name'];
        this.store.dispatch(new RequestUpdateTag({tag: {id: tag.id, changes: tag}}));
        this.editMode = !this.editMode;
    }

    deleteTag() {
        this.store.dispatch(new RequestDeleteTag(<any> {tagId: this.tag.id}));
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
    }

    selectTag() {
        let value;
        if (!this.isInt(this.id)) {
            value = this.id;
        } else if (this.isInt(this.id)) {
            const set = new Set([this.id]);
            value = Array.from(set);
        }
        this.store.dispatch(new SetCurrentTagsFilters({
            currentTagsFilter: new Filter({'id': 1, 'label': 'tags', 'value': value})
        }));
    }

    selectTags() {
        let result: Array<number| string> | string;
        const value = this.tagsIds;
        if (value instanceof String || typeof this.id === 'string') {
            result = <string> this.id;
        } else if (value instanceof Set) {
            if (value.has(this.id)) {
                value.delete(this.id);
            } else {
                value.add(this.id);
            }
            result = Array.from(value);
        }
        this.store.dispatch(new SetCurrentTagsFilters({
            currentTagsFilter: new Filter({'id': 1, 'label': 'tags', 'value': result})
        }));
    }

    private isInt(value: any): boolean {
        return Number.isInteger(value);
    }

}



