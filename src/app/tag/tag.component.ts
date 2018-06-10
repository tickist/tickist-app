import {Component, OnInit, Input, ViewContainerRef, EventEmitter, Output, AfterViewInit} from '@angular/core';
import {Observable, fromEvent, pipe} from 'rxjs';
import {TaskService} from '../services/task-service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TagService} from '../services/tag-service';
import {Tag} from '../models/tags';
import {bufferWhen, debounceTime, filter, map} from 'rxjs/operators';
import {interval} from 'rxjs/observable/interval';


@Component({
    selector: 'app-tag',
    templateUrl: './tag.component.html',
    styleUrls: ['./tag.component.scss']
})
export class TagComponent implements OnInit, AfterViewInit {
    @Input() label: string;
    @Input() id: any;
    @Input() tasksCounter: number;
    @Input() tag?: Tag;
    @Output() singleClick: EventEmitter<any> = new EventEmitter();
    @Output() doubleClick: EventEmitter<any> = new EventEmitter();
    eventStreamDouble: any;
    tagsIds: any;
    isActive: boolean;
    editTagForm: FormGroup;
    editMode = false;

    constructor(private fb: FormBuilder, public viewContainerRef: ViewContainerRef, private taskService: TaskService,
                protected tagService: TagService) {
        this.isActive = false;
    }

    ngOnInit() {
        this.taskService.currentTasksFilters$.subscribe((filters) => {
            if (filters.length > 0) {
                this.tagsIds = filters.filter((myFilter) => myFilter.label === 'tags')[0].value;
                this.isActive = (this.tagsIds.indexOf(this.id) > -1 || this.tagsIds === this.id);
            }
        });
        this.editTagForm = this.fb.group({
            'name': [this.label, Validators.required]
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

    ngAfterViewInit() {
        this.eventStreamDouble = fromEvent(this.viewContainerRef.element.nativeElement.querySelector('div.tag-name'), 'click');
        this.eventStreamDouble.pipe(
            bufferWhen(() => interval(500)),
            map((list: any) => {
                return list.hasOwnProperty(length) ? (<Array<number>>list).length : 0;
            }),
            filter(x => x >= 1)
        ).subscribe((v) => {
            if (v === 1) {
                this.singleClick.emit(this.id);
                console.log('single click');
            } else {
                this.doubleClick.emit(this.id);
                console.log('double click');
            }
        }, (a) => console.log(a));
    }

}



