import {Observable} from 'rxjs/Observable';
import {Component, OnInit, OnDestroy, HostListener} from '@angular/core';
import {AppStore} from '../store';
import {Store} from '@ngrx/store';
import {Router, RouterStateSnapshot, NavigationEnd} from '@angular/router';
import {Task} from '../models/tasks'
import {Project} from '../models/projects'
import {ProjectService} from '../services/projectService';
import {TaskService} from '../services/taskService';
import {UserService} from '../services/userService';
import {TagService} from '../services/tagService';
import {ObservableMedia, MediaChange} from '@angular/flex-layout';
import {ConfigurationService} from '../services/configurationService';
import {Subscription} from 'rxjs/Subscription';
import {SideNavVisibility} from '../models/configurations';
import * as _ from 'lodash';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  tasks: Task[];
  projects: Project[];
  subscriptions: Subscription;
  activeMediaQuery = '';
  leftSidenavVisibility: SideNavVisibility;
  rightSidenavVisibility: SideNavVisibility;

  constructor(public store: Store<AppStore>, public taskService: TaskService, public userService: UserService,
              public router: Router, public projectService: ProjectService, public tagService: TagService,
              protected media: ObservableMedia, protected configurationService: ConfigurationService) {
  }


  ngOnInit() {
    this.subscriptions = this.media.subscribe((change: MediaChange) => {
      this.configurationService.updateLeftSidenavVisibility();
      this.configurationService.updateRightSidenavVisibility();
    });

    this.subscriptions = this.configurationService.leftSidenavVisibility$.subscribe((visibility: SideNavVisibility) => {
      if (!_.isEmpty(visibility)) {
        this.leftSidenavVisibility = visibility;
      }
    });
    this.subscriptions.add(this.configurationService.rightSidenavVisibility$.subscribe((visibility) => {
      if (!_.isEmpty(visibility)) {
        this.rightSidenavVisibility = visibility;
      }
    }));


    // this.projectService.projects$.subscribe((projects) => {
    //   if (projects) {
    //     this.projects = projects;
    //   }
    // });
    //this.taskService.loadTasks();
    //this.tagService.loadTags();
    //this.projectService.loadProjects();
    //this.userService.loadUser();
    //this.userService.loadTeam();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  closeLeftSidenavVisiblity() {
    this.configurationService.changeOpenStateLeftSidenavVisibility('close');
  }

  closeRightSidenavVisiblity() {
    this.configurationService.changeOpenStateRightSidenavVisibility('close');
  }

}
