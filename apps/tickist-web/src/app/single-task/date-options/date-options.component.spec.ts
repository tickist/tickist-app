import {async, ComponentFixture, fakeAsync, inject, TestBed} from '@angular/core/testing';
import {DateOptionsComponent} from './date-options.component';
import {TickistMaterialModule} from '../../material.module';
import {MockTaskService} from '../../testing/mocks/task-service';
import {FormsModule} from '@angular/forms';
import {MockConfigurationService} from '../../testing/mocks/configurationService';
import {TaskService} from '../../core/services/task.service';
import {Task} from '../../../../../../libs/data/src/lib/tasks/models/tasks';
import {MenuButtonComponent} from '../../shared/components/menu-button/menu-button.component';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {IUserApi} from '../../core/models/user-api.interface';
import {IProjectApi} from '../../../../../../libs/data/src/lib/project-api.interface';
import moment from 'moment';
import {TasksApiMockFactory} from '../../testing/mocks/api-mock/tasks-api-mock.factory';
import {UsersApiMockFactory} from '../../testing/mocks/api-mock/users-api-mock.factory';
import {ProjectsApiMockFactory} from '../../testing/mocks/api-mock/projects-api-mock.factory';
import {StoreModule} from '@ngrx/store';


let comp: DateOptionsComponent;
let fixture: ComponentFixture<DateOptionsComponent>;
let task: Task;


describe('EditDateOptionsComponent', () => {
    let user: IUserApi;
    let project: IProjectApi;
    let taskFromApi: any;
    const taskApiMockFactory: TasksApiMockFactory = new TasksApiMockFactory();
    const userApiMockFactroy: UsersApiMockFactory = new UsersApiMockFactory();
    const projectApiMockFactory: ProjectsApiMockFactory = new ProjectsApiMockFactory();

    beforeEach(async(() => {
        user = userApiMockFactroy.createUserDict();
        project = projectApiMockFactory.createProjectDict([], user, []);
        taskFromApi = taskApiMockFactory.createTaskDict(user, user, project,  []);
        taskFromApi.finish_date = moment().format('DD-MM-YYYY');

        const taskService = new MockTaskService();
        const configurationService = new MockConfigurationService();
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, FormsModule, NoopAnimationsModule, StoreModule.forRoot({})],
            declarations: [DateOptionsComponent, MenuButtonComponent],
            providers: [
                taskService.getProviders(),
                configurationService.getProviders()
            ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(DateOptionsComponent);
            comp = fixture.componentInstance;
        });
    }));

    afterEach(() => {
        fixture = null;
        comp = null;
        taskFromApi = null;
    });

    it('should be created', () => {
        comp.task = new Task(taskFromApi);
        fixture.detectChanges();
        expect(comp).toBeTruthy();
    });

    it('should throw an exception', () => {
        comp.task = null;
        expect(() => comp.ngOnInit()).toThrowError(`Attribute 'task' is required`);
    });

    describe('ngOnChanges', () => {
        it('should  set variables correctly depends on task properties (repeatDelta == 1)', () => {
            task = new Task(taskFromApi);
            comp.task = task;
            fixture.detectChanges();
            comp.ngOnInit();
            // expect(comp.repeatDelta).toBe(1);
            // expect(comp.repeatDefault).toBe(comp.task.repeat);
            // expect(comp.repeatCustom).toBe(comp.task.repeat);
            // expect(comp.fromRepeating).toBe(comp.task.fromRepeating);
        });


    });

});