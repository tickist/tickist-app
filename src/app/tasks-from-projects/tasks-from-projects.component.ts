import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {TaskService} from '../services/taskService';
import {ActivatedRoute} from '@angular/router';
import {UserService} from '../services/userService';
import {ProjectService} from '../services/projectService';
import { Observable } from 'rxjs/Observable';
import {Task} from '../models/tasks';
import {Project} from '../models/projects';
import {User} from '../models/user';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/observable/combineLatest';
import {Subject} from 'rxjs/Subject';


class Timer {
  readonly start = performance.now();

  constructor(private readonly name: string) {}

  stop() {
    const time = performance.now() - this.start;
    console.log('Timer:', this.name, 'finished in', Math.round(time), 'ms');
  }
}



@Component({
  selector: 'tickist-tasks-from-projects',
  templateUrl: './tasks-from-projects.component.html',
  styleUrls: ['./tasks-from-projects.component.scss']
})
export class TasksFromProjectsComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();
  tasksStream$: Observable<any>;
  selectedProjectsStream$: Observable<any>;
  taskView: string;
  tasks: Task[];
  defaultTaskView: string;
  selectedProject: Project;
  t: Timer;
  t2: Timer;

  constructor(protected taskService: TaskService, private route: ActivatedRoute, protected userService: UserService,
              private projectService: ProjectService, private cd: ChangeDetectorRef) {
  }

  // When change detection begins
  ngDoCheck() {
    this.t = new Timer(`WHOLE LIST OF TASKS`)
  }


  ngAfterViewChecked() {
    this.t.stop();  // Prints the time elapsed to the JS console.
  }



  ngOnInit() {
    this.tasksStream$ = Observable.combineLatest(
      this.taskService.tasks$,
      this.projectService.selectedProjectsIds$,
      this.taskService.currentTasksFilters$,
      (tasks: Task[], selectedProjectsIds: Array<number>, currentTasksFilters: any) => {
        this.t2 = new Timer(`tasksStream$`)
        if (tasks && currentTasksFilters && currentTasksFilters.length > 0) {
          if (selectedProjectsIds) {
            tasks = tasks.filter((task => selectedProjectsIds.indexOf(task.taskProject.id) > -1));
          }
          tasks = TaskService.useFilters(tasks, currentTasksFilters);
        }
        this.t2.stop();
        return tasks;
      }
    );
    this.selectedProjectsStream$ = Observable.combineLatest(
      this.route.params.map(params => params['projectId']),
      this.projectService.projects$,
      this.userService.user$,
      (projectId: any, projects: Project[], user: User) => {
        console.log("czy tutaj jestem?")
        if (projectId && projects && projects.length > 0 && user) {
          const project = projects.filter(p => p.id === parseInt(projectId, 10))[0];
          if (project.hasOwnProperty('allDescendants')) {
            this.projectService.selectProjectsIds(project.allDescendants);
          }
          this.projectService.selectProject(project);
        } else {
          this.projectService.selectProjectsIds(null);
          this.projectService.selectProject(null);
          this.defaultTaskView = user.defaultTaskView;
          this.taskView = user.defaultTaskView;
        }
      }
    );
    this.selectedProjectsStream$.takeUntil(this.ngUnsubscribe).subscribe();
    this.projectService.selectedProject$.subscribe(project => {
      if (project) {
        this.selectedProject = project;
        this.defaultTaskView = project.defaultTaskView;
        this.taskView = project.defaultTaskView;
      }
    })
    this.tasksStream$.takeUntil(this.ngUnsubscribe).subscribe(tasks => {
      if (tasks && tasks.length > 0) {
        this.tasks = tasks;
        this.cd.markForCheck(); // marks path
      } else {
        this.tasks = []
      }
    })
  }

  changeTaskView(event) {
    console.log(event);
    this.taskView = event;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
