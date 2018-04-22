import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MockComponent} from 'mock-component';
import {TasksFromProjectsComponent} from './tasks-from-projects.component';
import {ChangeTaskViewComponent} from '../shared/change-task-view-component/change-task-view.component';
import {TickistMaterialModule} from '../app.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MenuButtonComponent} from '../shared/menu-button/menu-button.component';
import {RouterModule, Routes} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {SingleTaskComponent, SingleTaskSimplifiedComponent} from '../single-task/single-task.component';
import {TaskNameComponent} from '../single-task/task-name/task-name.component';
import {PinButtonComponent} from '../single-task/pin-button/pin-button.component';
import {DateOptionsComponent} from '../date-options/date-options.component';
import {EditRepeatingOptionComponent} from '../edit-repeating-options/edit-repeating-option.component';
import {ProgressBarComponent} from '../single-task/progress-bar/progress-bar.component';
import {DisplayFinishDateComponent} from '../single-task/display-finish-date/display-finish-date.component';
import {UserAvatarComponent} from '../user-avatar/user-avatar.component';
import {RightMenuComponent} from '../single-task/right-menu/right-menu.component';
import {ToggleButtonComponent} from '../single-task/toggle-button/toggle-button.component';
import {TruncatePipe} from '../pipes/truncate.pipe';
import {Minutes2hoursPipe} from '../pipes/minutes2hours';
import {AvatarSize} from '../pipes/avatarSize';
import {MockTaskService} from '../testing/mocks/taskService';
import {MockProjectService} from '../testing/mocks/projectService';
import {MockConfigurationService} from '../testing/mocks/configurationService';
import {APP_BASE_HREF} from '@angular/common';
import {MockActivatedRoute} from '../testing/mocks/activatedRoute';
import {MockUserService} from '../testing/mocks/userService';
import {Component, Input} from '@angular/core';
import {Task} from '../models/tasks';
import {MockTagService} from '../testing/mocks/tagService';
import {BlankComponent, RootComponent} from '../testing/test.modules';
import {PriorityComponent} from '../shared/priority/priority.component';
import {TasksListComponent} from '../tasks-list/tasks-list.component';
import {SortTasksComponent} from '../sort-tasks/sort-tasks.component';
import {FilterTasksComponent} from '../filter-tasks/filter-tasks.component';


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


describe('TasksFromProjectsComponent', () => {
    let component: TasksFromProjectsComponent;
    let fixture: ComponentFixture<TasksFromProjectsComponent>;

    beforeEach(async(() => {
        const configurationService = new MockConfigurationService();
        const projectService = new MockProjectService();
        const taskService = new MockTaskService();
        const tagService = new MockTagService();
        const userService = new MockUserService();
        const activatedRoute = new MockActivatedRoute;

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, FlexLayoutModule, RouterModule.forRoot(routes), FormsModule],
            declarations: [TasksFromProjectsComponent, ChangeTaskViewComponent, FilterTasksComponent,
                MockComponent(SortTasksComponent), MockComponent(TasksListComponent), MockComponent(MenuButtonComponent),
                MockComponent(SingleTaskSimplifiedComponent), MockComponent(SingleTaskComponent), 
                MockComponent(TaskNameComponent), MockComponent(PinButtonComponent), 
                MockComponent(DateOptionsComponent), MockComponent(RightMenuComponent), 
                MockComponent(EditRepeatingOptionComponent), MockComponent(ProgressBarComponent), 
                MockComponent(DisplayFinishDateComponent), MockComponent(UserAvatarComponent),
                MockComponent(PriorityComponent),
                MockComponent(ToggleButtonComponent), TruncatePipe, Minutes2hoursPipe, AvatarSize, RootComponent, BlankComponent],
            providers: [
                configurationService.getProviders(),
                projectService.getProviders(),
                taskService.getProviders(),
                tagService.getProviders(),
                userService.getProviders(),
                activatedRoute.getProviders(),
                {provide: APP_BASE_HREF, useValue: '/'}
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TasksFromProjectsComponent);
        component = fixture.componentInstance;
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
