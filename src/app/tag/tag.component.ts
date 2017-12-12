import {Component, OnInit, Input, ViewContainerRef, EventEmitter, Output, AfterViewInit} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {TaskService} from '../services/taskService';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TagService} from '../services/tagService';
import {Tag} from '../models/tags';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/bufferWhen';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/debounceTime';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.scss']
})
export class TagComponent implements OnInit, AfterViewInit  {
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
        this.tagsIds = filters.filter((filter) => filter.label === 'tags')[0].value;
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
    this.eventStreamDouble = Observable.fromEvent(this.viewContainerRef.element.nativeElement.querySelector('div.tag-name'), 'click');
    this.eventStreamDouble
      .bufferWhen(() => this.eventStreamDouble.debounceTime(250))
      .map((list) => list.length)
      .filter(x => x >= 1).subscribe((v) => {
        if (v === 1) {
          this.singleClick.emit(this.id);
          console.log('single click');
        } else {
          this.doubleClick.emit(this.id);
          console.log('double click');
        }
    });
  }

}



