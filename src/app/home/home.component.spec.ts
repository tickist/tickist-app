/* tslint:disable:no-unused-variable */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HomeComponent} from './home.component';
import {BlankComponent, RootComponent} from '../testing/test.modules';
import {MockTaskService} from '../testing/mocks/task-service';
import {MockConfigurationService} from '../testing/mocks/configurationService';
import {MockTagService} from '../testing/mocks/tag-service';
import {MockUserService} from '../testing/mocks/userService';
import {MockProjectService} from '../testing/mocks/project-service';
import {RouterModule, Routes} from '@angular/router';
import {AddTaskComponent} from '../add-task/add-task.component';
import { MockComponent } from 'ng-mocks';
import {GlobalStatisticsComponent} from '../statistics/global-statistics/global-statistics.component';
import {APP_BASE_HREF} from '@angular/common';
import {TickistMaterialModule} from '../material.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {NavComponent} from '../nav-component/nav.component';
import {ActionReducerMap, StoreModule} from '@ngrx/store';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ConfigurationService} from '../services/configuration.service';
import {MockObservableMedia} from '../testing/mocks/observableMedia';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: RootComponent
    },
    {
        path: 'home/task',
        component: BlankComponent
    }
];

const reducers: ActionReducerMap<any> = {};


describe('Component: Home', () => {
    let component: HomeComponent;
    let fixture: ComponentFixture<HomeComponent>;
    let configurationService;

    beforeEach(async(() => {
        const userService = new MockUserService();
        const taskService = new MockTaskService();
        const tagService = new MockTagService();
        configurationService = new MockConfigurationService();
        const projectService = new MockProjectService();
        const observableMedia = new MockObservableMedia();

        TestBed.configureTestingModule({
            imports: [RouterModule.forRoot(routes), FlexLayoutModule, TickistMaterialModule, NoopAnimationsModule,
                StoreModule.forRoot(reducers, {
                    initialState: {}
                })],
            declarations: [HomeComponent, RootComponent, BlankComponent, MockComponent(AddTaskComponent),
                MockComponent(GlobalStatisticsComponent), MockComponent(NavComponent)],
            providers: [
                {provide: APP_BASE_HREF, useValue: '/'},
                userService.getProviders(),
                taskService.getProviders(),
                tagService.getProviders(),
                configurationService.getProviders(),
                projectService.getProviders(),
                observableMedia.getProviders()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(HomeComponent);
        component = fixture.componentInstance;
    }));

    afterEach(() => {
        fixture = null;
        component = null;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set addTaskComponentVisibility to true', () => {
        const configurationServiceInstance = TestBed.get(ConfigurationService);
        configurationServiceInstance.setAddTaskComponentVisibilityResponse(true);
        component.ngOnInit();
        expect(component.addTaskComponentVisibility).toBe(true);
    });

    it('should have a tickist-add-task-component when addTaskComponentVisibility is set to true', () => {
        const configurationServiceInstance = TestBed.get(ConfigurationService);
        configurationServiceInstance.setAddTaskComponentVisibilityResponse(true);
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('tickist-add-task')).not.toBe(null);
    });

    it('should not have a tickist-add-task-component when addTaskComponentVisibility is set to false', () => {
        const configurationServiceInstance = TestBed.get(ConfigurationService);
        configurationServiceInstance.setAddTaskComponentVisibilityResponse(false);
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('tickist-add-task')).toBe(null);
    });

});

