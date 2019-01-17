import {EditRepeatingOptionComponent} from './edit-repeating-option.component';
import {async, ComponentFixture, inject, TestBed} from '@angular/core/testing';
import {MockTaskService} from '../testing/mocks/task-service';
import {MockConfigurationService} from '../testing/mocks/configurationService';
import {TickistMaterialModule} from '../material.module';
import {FormsModule} from '@angular/forms';
import {fakeAsync} from '@angular/core/testing';
import {ConfigurationService} from '../services/configuration.service';
import {Task} from '../models/tasks';
import {TaskService} from '../services/task.service';
import {IUserApi} from '../models/user-api.interface';
import {IProjectApi} from '../models/project-api.interface';
import {ITaskApi} from '../models/task-api.interface';
import {TasksApiMockFactory} from '../testing/mocks/api-mock/tasks-api-mock.factory';
import {UsersApiMockFactory} from '../testing/mocks/api-mock/users-api-mock.factory';
import {ProjectsApiMockFactory} from '../testing/mocks/api-mock/projects-api-mock.factory';
import * as moment from 'moment';


let comp: EditRepeatingOptionComponent;
let fixture: ComponentFixture<EditRepeatingOptionComponent>;
let task: Task;


describe('Edit repeating Component', () => {
    let user: IUserApi;
    let project: IProjectApi;
    let taskFromApi: ITaskApi;
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
            imports: [TickistMaterialModule, FormsModule],
            declarations: [EditRepeatingOptionComponent],
            providers: [
                taskService.getProviders(),
                configurationService.getProviders()
            ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(EditRepeatingOptionComponent);
            comp = fixture.componentInstance;

        });
    }));
    afterEach(() => {
        comp = null;
        fixture = null;
        task = null;
        taskFromApi = null;
    });
    it('should create', () => {
        expect(comp).toBeTruthy();
    });
    describe('ngOnInit', () => {
        it('should set three variables', fakeAsync(inject([ConfigurationService],
            (configurationService: ConfigurationService) => {
                expect(comp.defaultRepeatOptions).toBeFalsy();
                expect(comp.customRepeatOptions).toBeFalsy();
                expect(comp.fromRepeatingOptions).toBeFalsy();
                task = new Task(taskFromApi);
                comp.task = task;
                comp.ngOnInit();
                expect(comp.defaultRepeatOptions).toBe(configurationService.loadConfiguration()['commons']['DEFAULT_REPEAT_OPTIONS']);
                expect(comp.customRepeatOptions).toBe(configurationService.loadConfiguration()['commons']['CUSTOM_REPEAT_OPTIONS']);
                expect(comp.fromRepeatingOptions).toBe(configurationService.loadConfiguration()['commons']['FROM_REPEATING_OPTIONS']);

            })));

        it('should throw an exception when task is null or undefined', () => {
            expect(() => {
                comp.ngOnInit();
            }).toThrow(new Error('Task cannot be null'));
        });
    });


    describe('saveTask', () => {
        it('should call method updateTask from taskService', fakeAsync(inject([TaskService],
            (taskService: TaskService) => {
                task = new Task(taskFromApi);
                comp.task = task;
                comp.ngOnInit();
                comp.saveTask({}, '');
                expect(taskService.updateTask).toHaveBeenCalledWith(task, true);
            })));

        it('should update task model when the repeat default is changed (scenario 1. -> default repeat )', fakeAsync(inject([TaskService],
            (taskService: TaskService) => {
                const taskRepeat = 2;
                task = new Task(taskFromApi);
                comp.task = task;
                comp.ngOnInit();
                comp.saveTask({value: taskRepeat}, 'repeatDefault');
                expect(comp.task.repeat).toBe(taskRepeat);
                expect(comp.task.repeatDelta).toBe(1);
                expect(taskService.updateTask).toHaveBeenCalledWith(task, true);
            })));

        it('should update task model when the repeat default is changed (scenario 2. -> repeat custom)', fakeAsync(inject([TaskService],
            (taskService: TaskService) => {
                const taskRepeat = 99;
                const repeatDelta = 5;
                const repeatCustom = 4;
                task = new Task(taskFromApi);
                comp.task = task;
                comp.ngOnInit();
                comp.repeatDelta = repeatDelta;
                comp.repeatCustom = repeatCustom;
                comp.saveTask({value: taskRepeat}, 'repeatDefault');
                expect(comp.task.repeat).toBe(repeatCustom);
                expect(comp.task.repeatDelta).toBe(repeatDelta);
                expect(taskService.updateTask).toHaveBeenCalledWith(task, true);
            })));
    });


});
