import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {ActivationStart, Router, RouterOutlet} from '@angular/router';
import {Task} from '@data/tasks/models/tasks';
import {Project} from '@data/projects';
import {ProjectService} from '../../services/project.service';
import {TaskService} from '../../services/task.service';
import {UserService} from '../../services/user.service';
import {TagService} from '../../services/tag.service';
import {MediaChange, MediaObserver} from '@angular/flex-layout';
import {ConfigurationService} from '../../services/configuration.service';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {mergeMapTo, takeUntil} from 'rxjs/operators';
import {SideNavVisibility} from '@data/configurations';
import {AngularFireMessaging} from '@angular/fire/messaging';


@Component({
    selector: 'tickist-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
    // @ViewChild('contentOutlet', {read: RouterOutlet, static: true}) contentOutlet: RouterOutlet;
    tasks: Task[];
    projects: Project[];
    leftSidenavVisibility: SideNavVisibility;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private store: Store<{}>, private taskService: TaskService, private userService: UserService,
                private router: Router, private projectService: ProjectService, private tagService: TagService,
                private media: MediaObserver, private configurationService: ConfigurationService,
                private cd: ChangeDetectorRef, private afMessaging: AngularFireMessaging) {
    }


    ngOnInit() {

        this.leftSidenavVisibility = new SideNavVisibility(
            {'open': true, 'mode': '', 'position': 'start'});

        this.media.media$.pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe((change: MediaChange) => {
            this.configurationService.updateLeftSidenavVisibility();
            this.cd.detectChanges();
        });

        this.configurationService.leftSidenavVisibility$
            .pipe(
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((visibility: SideNavVisibility) => {
                if (!_.isEmpty(visibility)) {
                    this.leftSidenavVisibility = visibility;
                    this.cd.detectChanges();
                }
            });

    }

    requestPermission() {
        this.afMessaging.requestPermission
            .pipe(
                mergeMapTo(this.afMessaging.tokenChanges)
            )
            .subscribe(
                (token) => {
                    console.log('Permission granted! Save to the server!', token);
                    this.userService.savefcmToken(token)
                    },
                (error) => { console.error(error); },
            );
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    closeLeftSidenavVisiblity() {
        this.configurationService.changeOpenStateLeftSidenavVisibility('close');
    }
}
