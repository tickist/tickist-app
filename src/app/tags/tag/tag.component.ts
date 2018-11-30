import {Component, OnInit, Input, ViewContainerRef} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TagService} from '../../services/tag.service';
import {Tag} from '../../models/tags';
import {TasksFiltersService} from '../../services/tasks-filters.service';
import {Filter} from '../../models/filter';


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
    eventStreamDouble: any;
    tagsIds: string | Set<number>;
    isActive: boolean;
    isChecked: boolean;
    editTagForm: FormGroup;
    editMode = false;
    isCheckboxModeEnabled = false;

    constructor(private fb: FormBuilder, private tasksFiltersService: TasksFiltersService, private tagService: TagService) {
        this.isActive = false;
    }

    ngOnInit() {
        this.tasksFiltersService.currentTasksFilters$.subscribe((filters) => {
            if (filters.length > 0) {
                this.tagsIds = filters.find((myFilter) => myFilter.label === 'tags').value;
                this.isActive = ((this.tagsIds instanceof Set && this.tagsIds.has(<number>this.id)) || this.tagsIds === this.id);
                this.isChecked = ((this.tagsIds instanceof Set && this.tagsIds.has(<number>this.id)) || this.tagsIds === this.id);
                this.isCheckboxModeEnabled = this.isInt(this.id)  && (this.tagsIds instanceof Set) && this.tagsIds.size > 0;
            }
        });
        this.editTagForm = new FormGroup({
            'name': new FormControl(this.label, Validators.required)
        });
    }

    editTag(values) {
        const tag = JSON.parse(JSON.stringify(this.tag));
        tag.name = values['name'];
        this.tagService.updateTag(tag);
    }

    deleteTag() {
        this.tagService.deleteTag(this.tag);
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
    }

    selectTag() {
        let value;
        if (!this.isInt(this.id)) {
            value = this.id;
        } else if (this.isInt(this.id)) {
            value = new Set([this.id]);
        }
        this.tasksFiltersService.updateCurrentFilter(new Filter({'id': 1, 'label': 'tags', 'value': value}));
    }

    selectTags() {
        let value = this.tasksFiltersService.getCurrentTagsFilterValue();
        if (value instanceof String || typeof this.id === 'string') {
            value = this.id;
        } else if (value instanceof Set) {
            if (value.has(this.id)) {
                value.delete(this.id);
            } else {
                value.add(this.id);
            }
        }
        this.tasksFiltersService.updateCurrentFilter({'id': 1, 'label': 'tags', 'value': value});
    }

    private isInt(value: any): boolean {
        return Number.isInteger(value);
    }

    // ngAfterViewInit() {
    //     this.eventStreamDouble = fromEvent(this.viewContainerRef.element.nativeElement.querySelector('div.tag-name'), 'click');
    //     this.eventStreamDouble.pipe(
    //         bufferWhen(() => interval(500)),
    //         map((list: any) => {
    //             return list.hasOwnProperty(length) ? (<Array<number>>list).length : 0;
    //         }),
    //         filter(x => x >= 1)
    //     ).subscribe((v) => {
    //         if (v === 1) {
    //             this.singleClick.emit(this.id);
    //             console.log('single click');
    //         } else {
    //             this.doubleClick.emit(this.id);
    //             console.log('double click');
    //         }
    //     }, (a) => console.log(a));
    // }

}



