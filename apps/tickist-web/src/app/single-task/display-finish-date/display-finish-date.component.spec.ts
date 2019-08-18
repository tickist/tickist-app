import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {DisplayFinishDateComponent} from './display-finish-date.component';
import {Task} from '@data/tasks/models/tasks';
import {TasksApiMockFactory} from '../../testing/mocks/api-mock/tasks-api-mock.factory';
import {UsersApiMockFactory} from '../../testing/mocks/api-mock/users-api-mock.factory';
import {ProjectsApiMockFactory} from '../../testing/mocks/api-mock/projects-api-mock.factory';
import {format} from 'date-fns';


describe('DisplayFinishDateComponent', () => {
    let component: DisplayFinishDateComponent;
    let fixture: ComponentFixture<DisplayFinishDateComponent>;
    let user: any;
    let project: any;
    let task: any;
    const taskApiMockFactory: TasksApiMockFactory = new TasksApiMockFactory();
    const usersApiMockFactory: UsersApiMockFactory = new UsersApiMockFactory();
    const projectApiMockFactory: ProjectsApiMockFactory = new ProjectsApiMockFactory();

    beforeEach(async(() => {
        user = usersApiMockFactory.createUserDict();
        project = projectApiMockFactory.createProjectDict([], user, []);
        task = taskApiMockFactory.createTaskDict(user, user, project,  []);
        task.finish_date = format(new Date, 'dd-MM-yyyy');
        TestBed.configureTestingModule({
            declarations: [DisplayFinishDateComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DisplayFinishDateComponent);
        component = fixture.componentInstance;
        task = Object.assign({}, task);
    }));

    afterEach(() => {
        fixture = null;
        component = null;
        task = null;
    });

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
