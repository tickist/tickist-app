import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {AppStore} from '../store';
import {Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {Task} from '../models/tasks';
import {Project} from '../models/projects';
import {ProjectService} from '../services/project.service';
import {TaskService} from '../services/task.service';
import {UserService} from '../services/user.service';
import {TagService} from '../services/tag.service';
import {ObservableMedia, MediaChange} from '@angular/flex-layout';
import {ConfigurationService} from '../services/configuration.service';
import {SideNavVisibility} from '../models';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';



@Component({
    selector: 'tickist-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
    tasks: Task[];
    projects: Project[];
    leftSidenavVisibility: SideNavVisibility;
    rightSidenavVisibility: SideNavVisibility;
    addTaskComponentVisibility: boolean;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private store: Store<AppStore>, private taskService: TaskService, private userService: UserService,
                private router: Router, private projectService: ProjectService, private tagService: TagService,
                private media: ObservableMedia, private configurationService: ConfigurationService,
                private cd: ChangeDetectorRef) {
    }


    ngOnInit() {
        this.leftSidenavVisibility = new SideNavVisibility(
            {'open': true, 'mode': '', 'position': 'start'});
        this.rightSidenavVisibility = new SideNavVisibility({'open': true, 'mode': '', 'position': 'end'});

        this.media.subscribe((change: MediaChange) => {
            console.log(change)
            this.configurationService.updateLeftSidenavVisibility();
            this.configurationService.updateRightSidenavVisibility();
            this.cd.detectChanges();
        });

        this.configurationService.leftSidenavVisibility$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((visibility: SideNavVisibility) => {
            if (!_.isEmpty(visibility)) {
                this.leftSidenavVisibility = visibility;
                this.cd.detectChanges();
            }
        });
        this.configurationService.rightSidenavVisibility$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((visibility) => {
            if (!_.isEmpty(visibility)) {
                this.rightSidenavVisibility = visibility;
                this.cd.detectChanges();
            }
        });

        this.configurationService.addTaskComponentVisibility$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(visibility => {
            this.addTaskComponentVisibility = visibility;
            this.cd.detectChanges();
        });

    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    closeLeftSidenavVisiblity() {
        this.configurationService.changeOpenStateLeftSidenavVisibility('close');
    }

    closeRightSidenavVisiblity() {
        this.configurationService.changeOpenStateRightSidenavVisibility('close');
    }

}
