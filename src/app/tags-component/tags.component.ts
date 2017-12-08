import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import {TagService} from '../services/tagService';
import {Tag} from '../models/tags';
import {Task} from '../models/tasks';
import {TaskService} from '../services/taskService';
import {UserService} from '../services/userService';
import {User} from '../models/user';
import {SideNavVisibility} from '../models';
import {ConfigurationService} from '../services/configurationService';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit, OnDestroy {
  tags: Tag[];
  tasks: Task[];
  user: User;
  tasksStream$: Observable<any>;
  tagsStream$: Observable<any>;
  defaultTaskView: string;
  taskView: string;
  leftSidenavVisibility: SideNavVisibility;
  rightSidenavVisibility: SideNavVisibility;
  subscriptions: Subscription;

  constructor(private tagService: TagService, private  taskService: TaskService,
              protected userService: UserService, protected configurationService: ConfigurationService) {

  }

  ngOnInit() {
    this.tagsStream$ = Observable.combineLatest(
      this.tagService.tags$,
      this.taskService.currentTasksFilters$,
      (tags: Tag[], currentTasksFilters: any) => {
        return tags;
      }
    );
    this.tasksStream$ = Observable.combineLatest(
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
    this.subscriptions.add(this.userService.user$.subscribe((user) => {
      this.user = user;
    }));
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }
  private isInt(value) {
    // @TODO DRY
    return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value));
  }

  changeTaskView(event) {
    console.log(event);
    this.taskView = event;
  }
}
