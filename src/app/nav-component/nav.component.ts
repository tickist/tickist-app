import {Component, OnInit, OnDestroy, ElementRef, ViewChild, Renderer2, AfterViewInit} from '@angular/core';
import {UserService} from '../services/userService';
import {User} from '../models/user';
import {ConfigurationService} from '../services/configurationService';
import {environment} from '../../environments/environment';
import {ObservableMedia} from '@angular/flex-layout';
import {NavigationEnd, Router} from '@angular/router';
import {TaskService} from '../services/taskService';
import {ProjectService} from '../services/projectService';
import {Subject} from 'rxjs/Subject';


@Component({
    selector: 'app-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit, OnDestroy, AfterViewInit {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    user: User;
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

    constructor(private userService: UserService, private configurationService: ConfigurationService,
                protected projectService: ProjectService, protected media: ObservableMedia, protected router: Router,
                protected taskService: TaskService, private renderer: Renderer2) {
    }

    ngOnInit() {
        this.staticUrl = environment['staticUrl'];

        this.router.events
            .filter(event => event instanceof NavigationEnd)
            .subscribe((event: NavigationEnd) => {
                this.addClassToActiveElement(event.urlAfterRedirects);
            });
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
        this.configurationService.offlineModeNotification$.takeUntil(this.ngUnsubscribe).subscribe(value => {
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

    toggleRightSideNavVisibility(): void {
        let newOpenState;
        if (this.rightSideNavVisibility.open) {
            newOpenState = 'close';
        } else {
            newOpenState = 'open';
        }
        this.configurationService.changeOpenStateRightSidenavVisibility(newOpenState);
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
