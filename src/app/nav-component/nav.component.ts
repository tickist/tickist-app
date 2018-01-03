import {Component, OnInit, OnDestroy} from '@angular/core';
import {UserService} from '../services/userService';
import {User} from '../models/user';
import {ConfigurationService} from '../services/configurationService';
import {environment} from '../../environments/environment';
import {ObservableMedia} from '@angular/flex-layout';
import {Router} from '@angular/router';
import {TaskService} from '../services/taskService';
import {ProjectService} from '../services/projectService';


@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit, OnDestroy {
  user: User;
  staticUrl: string;
  leftSideNavVisibility: any = {};
  rightSideNavVisibility: any = {};
  progressBar = false;

  constructor(private userService: UserService, private configurationService: ConfigurationService,
              protected projectService: ProjectService, protected media: ObservableMedia, protected router: Router,
              protected taskService: TaskService) {
  }

  ngOnInit() {
    this.staticUrl = environment['staticUrl'];
    this.configurationService.progressBar$.subscribe(progressBar => this.progressBar = progressBar);
    this.userService.user$.subscribe((user) => {
      if (user) {
        this.user = user;
      }
    });
    this.configurationService.leftSidenavVisibility$.subscribe((state) => {
      this.leftSideNavVisibility = state;
    });
    this.configurationService.rightSidenavVisibility$.subscribe((state) => {
      this.rightSideNavVisibility = state;
    });
  }

  toggleLeftSideNavVisibility() {
    let newOpenState;
    if (this.leftSideNavVisibility.open) {
      newOpenState = 'close';
    } else {
      newOpenState = 'open';
    }
    this.configurationService.changeOpenStateLeftSidenavVisibility(newOpenState);
  }

  toggleRightSideNavVisibility() {
    let newOpenState;
    if (this.rightSideNavVisibility.open) {
      newOpenState = 'close';
    } else {
      newOpenState = 'open';
    }
    this.configurationService.changeOpenStateRightSidenavVisibility(newOpenState)
  }

  navigateTo(path, primaryPath = null, primaryArg = null, leftSideNavPath = null) {
    const navigate = [];
    navigate.push(path);
    if (primaryPath) {
      const primaryArgs = [];
      if (primaryPath) {
        primaryArgs.push(primaryPath);
      }
      if (primaryArg ) {
        primaryArgs.push(primaryArg);
      }
      navigate.push({outlets: {'primary': primaryArgs, 'leftSideNav': [leftSideNavPath]}});
    }
    this.taskService.loadCurrentTasksFilters(this.user);
    this.projectService.selectProject(null);
    this.router.navigate(navigate);
    if (this.media.isActive('sm') || this.media.isActive('xs')) {
      this.configurationService.changeOpenStateLeftSidenavVisibility('close');
    }
  }

  logout() {
    this.userService.logout();
  }

  ngOnDestroy() {

  }
}
