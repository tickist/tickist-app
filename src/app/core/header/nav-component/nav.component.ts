import {Component, OnInit, OnDestroy, ElementRef, ViewChild, Renderer2, AfterViewInit} from '@angular/core';
import {User} from '../../models';
import {ConfigurationService} from '../../../services/configuration.service';
import {environment} from '../../../../environments/environment';
import {MediaObserver} from '@angular/flex-layout';
import {NavigationEnd, Router} from '@angular/router';
import {ProjectService} from '../../../services/project.service';
import {Subject, pipe, Observable} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {selectLoggedInUser} from '../../selectors/user.selectors';
import {AppStore} from '../../../store';
import {SetActiveProject} from '../../actions/projects/active-project.actions';
import {selectProgressBarIsEnabled} from '../../../reducers/core.selectors';
import {editUserSettingsRoutesName} from '../../../modules/edit-user-settings/routes-names';
import {Logout} from '../../actions/auth.actions';
import {teamRoutesName} from '../../../modules/team/routes-names';
import {dashboardRoutesName} from '../../../modules/dashboard/routes.names';


@Component({
    selector: 'tickist-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit, OnDestroy, AfterViewInit {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    user: User;
    user$: Observable<User>;
    progressBarIsEnabled$: Observable<boolean>;
    staticUrl: string;
    leftSideNavVisibility: any = {};
    rightSideNavVisibility: any = {};
    progressBar = false;
    isOffline = false;

    @ViewChild('homeElement', {read: ElementRef}) homeElement: ElementRef;
    @ViewChild('homeMobileElement', {read: ElementRef}) homeMobileElement: ElementRef;
    @ViewChild('projectsElement', {read: ElementRef}) projectsElement: ElementRef;
    @ViewChild('projectsMobileElement', {read: ElementRef}) projectsMobileElement: ElementRef;
    @ViewChild('tagsElement', {read: ElementRef}) tagsElement: ElementRef;
    @ViewChild('tagsMobileElement', {read: ElementRef}) tagsMobileElement: ElementRef;

    constructor(private configurationService: ConfigurationService,
                private projectService: ProjectService, private media: MediaObserver, private router: Router,
                private renderer: Renderer2,
                private store: Store<AppStore>) {
    }

    ngOnInit() {
        this.staticUrl = environment['staticUrl'];

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            takeUntil(this.ngUnsubscribe)
        ).subscribe((event: NavigationEnd) => {
            this.addClassToActiveElement(event.urlAfterRedirects);
        });

        this.progressBarIsEnabled$ = this.store.select(selectProgressBarIsEnabled);
        this.user$ = this.store.select(selectLoggedInUser);

        this.user$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((user: User) => this.user = user);

        this.configurationService.leftSidenavVisibility$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((state) => {
            this.leftSideNavVisibility = state;
        });

        this.configurationService.offlineModeNotification$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(value => {
            this.isOffline = value;
        });

    }

    ngAfterViewInit(): void {
        this.addClassToActiveElement(this.router.url);
    }

    toggleLeftSideNavVisibility(): void {
        let newOpenState;
        if (this.leftSideNavVisibility.open) {
            newOpenState = 'close';
        } else {
            newOpenState = 'open';
        }
        this.configurationService.changeOpenStateLeftSidenavVisibility(newOpenState);
    }

    navigateTo(path, primaryPath = null, primaryArg = null, leftSideNavPath = null): void {
        const navigate = [];
        navigate.push(path);
        if (primaryPath) {
            const primaryArgs = [];
            if (primaryPath) {
                primaryArgs.push(primaryPath);
            }
            if (primaryArg) {
                primaryArgs.push(primaryArg);
            }
            navigate.push({outlets: {'primary': primaryArgs, 'leftSideNav': [leftSideNavPath]}});
        }
        this.store.dispatch(new SetActiveProject({project: undefined}));
        // this.projectService.selectProject(null);
        this.router.navigate(navigate);
        if (this.media.isActive('sm') || this.media.isActive('xs')) {
            this.configurationService.changeOpenStateLeftSidenavVisibility('close');
        }
    }

    navigateToTeam() {
        this.router.navigate(['home', {outlets: {content: [teamRoutesName.TEAM]}}]);
    }

    navigateToUserSettings() {
        this.router.navigate(['home', {outlets: {content: [editUserSettingsRoutesName.EDIT_USER_SETTINGS]}}]);
    }

    navigateToWeekdays() {
        this.router.navigate(['home', {outlets: {content: [dashboardRoutesName.DASHBOARD]}}]);
    }

    logout() {
        this.store.dispatch(new Logout());
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    addClassToActiveElement(url) {
        this.removeActiveClassFromMenu();
        if (url.indexOf('projects') > -1) {
            if (this.projectsElement) {
                this.renderer.addClass(this.projectsElement.nativeElement, 'active');
            }
            if (this.projectsMobileElement) {
                this.renderer.addClass(this.projectsMobileElement.nativeElement, 'active');
            }

        } else if (url.indexOf('tags') > -1) {
            if (this.tagsElement) {
                this.renderer.addClass(this.tagsElement.nativeElement, 'active');
            }
            if (this.tagsMobileElement) {
                this.renderer.addClass(this.tagsMobileElement.nativeElement, 'active');
            }
        } else if (url === '/home') {
            if (this.homeElement) {
                this.renderer.addClass(this.homeElement.nativeElement, 'active');
            }
            if (this.homeMobileElement) {
                this.renderer.addClass(this.homeMobileElement.nativeElement, 'active');
            }


        }
    }

    private removeActiveClassFromMenu() {
        if (this.homeElement) {
            this.renderer.removeClass(this.homeElement.nativeElement, 'active');
        }
        if (this.homeMobileElement) {
            this.renderer.removeClass(this.homeMobileElement.nativeElement, 'active');
        }
        if (this.projectsElement) {
            this.renderer.removeClass(this.projectsElement.nativeElement, 'active');
        }
        if (this.projectsMobileElement) {
            this.renderer.removeClass(this.projectsMobileElement.nativeElement, 'active');
        }
        if (this.tagsElement) {
            this.renderer.removeClass(this.tagsElement.nativeElement, 'active');
        }
        if (this.tagsMobileElement) {
            this.renderer.removeClass(this.tagsMobileElement.nativeElement, 'active');
        }
    }

}
