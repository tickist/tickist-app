import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {RightMenuComponent} from './right-menu.component';
import {TickistMaterialModule} from '../../material.module';
import {Component, Input} from '@angular/core';
import {MockComponent} from 'ng-mocks';
import {BlankComponent, RootComponent} from '../../testing/test.modules';
import {RouterModule, Routes} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {Task} from '../../models/tasks';
import {PinButtonComponent} from '../pin-button/pin-button.component';
import {MenuButtonComponent} from '../../shared/components/menu-button/menu-button.component';
import {PriorityComponent} from '../../shared/components/priority/priority.component';
import {TasksApiMockFactory} from '../../testing/mocks/api-mock/tasks-api-mock.factory';
import {UsersApiMockFactory} from '../../testing/mocks/api-mock/users-api-mock.factory';
import {ProjectsApiMockFactory} from '../../testing/mocks/api-mock/projects-api-mock.factory';
import {User} from '../../core/models';
import {Project} from '../../models/projects';
import {IUserApi} from '../../models/user-api.interface';
import {IProjectApi} from '../../models/project-api.interface';
import {ITaskApi} from '../../models/task-api.interface';
import {RouterTestingModule} from '@angular/router/testing';


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


describe('RightMenuComponent', () => {
    let user: IUserApi;
    let project: IProjectApi;
    let task: ITaskApi;
    let component: RightMenuComponent;
    let fixture: ComponentFixture<RightMenuComponent>;
    const taskApiMockFactory: TasksApiMockFactory = new TasksApiMockFactory();
    const userApiMockFactroy: UsersApiMockFactory = new UsersApiMockFactory();
    const projectApiMockFactory: ProjectsApiMockFactory = new ProjectsApiMockFactory();

    beforeEach(async(() => {
        user = userApiMockFactroy.createUserDict();
        project = projectApiMockFactory.createProjectDict([], user, []);
        task = taskApiMockFactory.createTaskDict(user, user, project,  []);
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, RouterTestingModule.withRoutes(routes)],
            declarations: [
                RightMenuComponent,
                MockComponent(PinButtonComponent),
                MockComponent(MenuButtonComponent),
                MockComponent(PriorityComponent),
                RootComponent,
                BlankComponent
            ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(RightMenuComponent);
            component = fixture.componentInstance;
        });
    }));


    it('should create', () => {
        component.task = new Task(task);
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });


    it('should throw an exception', () => {
        component.task = null;
        expect(() => component.ngOnInit()).toThrowError(`Attribute 'task' is required`);
    });
});
