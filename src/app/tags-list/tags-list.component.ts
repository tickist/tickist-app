import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription, combineLatest} from 'rxjs';

import {TagService} from '../services/tagService';
import {Tag} from '../models/tags';
import {Task} from '../models/tasks';
import {TaskService} from '../services/taskService';
import {FormBuilder, Validators, FormGroup} from '@angular/forms';
import {UserService} from '../services/userService';
import {User} from '../models/user';
import {SideNavVisibility} from '../models';
import {ConfigurationService} from '../services/configurationService';

@Component({
  selector: 'app-tags-list',
  templateUrl: './tags-list.component.html',
  styleUrls: ['./tags-list.component.scss']
})
export class TagsListComponent implements OnInit, OnDestroy {
  tags: Tag[];
  tasks: Task[];
  user: User;
  tasksStream$: Observable<any>;
  tagsStream$: Observable<any>;
  createTagForm: FormGroup;
  defaultTaskView: string;
  taskView: string;
  leftSidenavVisibility: SideNavVisibility;
  rightSidenavVisibility: SideNavVisibility;
  subscriptions: Subscription;

  constructor(private fb: FormBuilder, private tagService: TagService, private  taskService: TaskService,
              protected userService: UserService, protected configurationService: ConfigurationService) {

  }

  ngOnInit() {
    this.tagsStream$ = combineLatest(
      this.tagService.tags$,
      this.taskService.currentTasksFilters$,
      (tags: Tag[], currentTasksFilters: any) => {
        return tags;
      }
    );
    this.tasksStream$ = combineLatest(
      this.taskService.tasks$,
      this.taskService.currentTasksFilters$,
      (tasks: Task[], currentTasksFilters: any) => {
        if (currentTasksFilters.length > 0) {
          tasks = TaskService.useFilters(tasks, currentTasksFilters);
        }
        return tasks;
      }
    );
    this.subscriptions =  this.tagsStream$.subscribe((tags) => {
      if (tags) {
        this.tags = tags;
      }
    });
    this.subscriptions.add(this.tasksStream$.subscribe(((tasks) => {
      if (tasks) {
        this.tasks = tasks;
      }
    })));
    this.createTagForm = this.fb.group({
      'name': ['', Validators.required]
    });
    this.subscriptions.add(this.userService.user$.subscribe((user) => {
      this.user = user;
    }));
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  createTag(values) {
    if (this.createTagForm.valid) {
      this.tagService.createTag(new Tag({name: values['name']}));
      this.createTagForm.reset();
    }

  }
  private isInt(value) {
    // @TODO DRY
    return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value));
  }
  selectTagSingleClick(tagId) {
    let value;
    if (tagId instanceof String || typeof tagId === 'string') {
      value = tagId;
    } else if (this.isInt(tagId)) {
      value = [tagId];
    }
    this.taskService.updateCurrentFilter({'id': 1, 'label': 'tags', 'value': value});
  }

  selectTagDoubleClick(tagId) {
    let value = this.taskService.getCurrentTagsFilterValue();
    if (value instanceof String || typeof tagId === 'string') {
      value = tagId;
    } else if (value instanceof Array) {
      value.push(tagId);
    }
    this.taskService.updateCurrentFilter({'id': 1, 'label': 'tags', 'value': value});
  }

  changeTaskView(event) {
    console.log(event);
    this.taskView = event;
  }

  trackByFn(index, item) {
    return item.id;
  }

}
