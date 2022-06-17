import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Router } from "@angular/router";
import { Task } from "@data/tasks/models/tasks";
import { Project } from "@data/projects";
import { ProjectService } from "../../services/project.service";
import { TaskService } from "../../services/task.service";
import { UserService } from "../../services/user.service";
import { TagService } from "../../services/tag.service";
import { MediaChange, MediaObserver } from "@angular/flex-layout";
import { ConfigurationService } from "../../services/configuration.service";
import _ from "lodash";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { SideNavVisibility } from "@data/configurations";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { selectLoggedInUser } from "../../selectors/user.selectors";
import { NotificationPermission, User } from "@data";
import { SnackBarNotificationComponent } from "../../../modules/notifications/components/snack-bar-notification/snack-bar-notification.component";

@Component({
    selector: "tickist-home",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit, OnDestroy {
    tasks: Task[];
    projects: Project[];
    leftSidenavVisibility: SideNavVisibility;
    config: MatSnackBarConfig;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private store: Store,
        private taskService: TaskService,
        private userService: UserService,
        private router: Router,
        private projectService: ProjectService,
        private tagService: TagService,
        private media: MediaObserver,
        private configurationService: ConfigurationService,
        private cd: ChangeDetectorRef,
        private snackBar: MatSnackBar
    ) {
        this.config = new MatSnackBarConfig();
    }

    ngOnInit() {
        this.leftSidenavVisibility = new SideNavVisibility({
            open: true,
            mode: "",
            position: "start",
        });

        this.media.media$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((change: MediaChange) => {
                this.configurationService.updateLeftSidenavVisibility();
                this.cd.detectChanges();
            });

        this.configurationService.leftSidenavVisibility$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((visibility: SideNavVisibility) => {
                if (!_.isEmpty(visibility)) {
                    this.leftSidenavVisibility = visibility;
                    this.cd.detectChanges();
                }
            });

        this.store
            .pipe(
                select(selectLoggedInUser),
                filter((user) => !!user),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((user: User) => {
                if (
                    user.notificationPermission ===
                    NotificationPermission.unknown
                ) {
                    this.snackBar.openFromComponent(
                        SnackBarNotificationComponent,
                        this.config
                    );
                }
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    closeLeftSidenavVisibility() {
        this.configurationService.changeOpenStateLeftSidenavVisibility("close");
    }
}
