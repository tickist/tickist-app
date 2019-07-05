import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ChangeFinishDateDialogComponent} from './change-finish-date-dialog.component';
import {TickistMaterialModule} from '../../material.module';
import {ReactiveFormsModule} from '@angular/forms';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {Task} from '../../models/tasks';
import {IUserApi} from '../../models/user-api.interface';
import {IProjectApi} from '../../models/project-api.interface';
import {TasksApiMockFactory} from '../../testing/mocks/api-mock/tasks-api-mock.factory';
import {UsersApiMockFactory} from '../../testing/mocks/api-mock/users-api-mock.factory';
import {ProjectsApiMockFactory} from '../../testing/mocks/api-mock/projects-api-mock.factory';

describe('ChangeFinishDateDialogComponent', () => {
    let user: IUserApi;
    let project: IProjectApi;
    let task: Task;
    const taskApiMockFactory: TasksApiMockFactory = new TasksApiMockFactory();
    const userApiMockFactroy: UsersApiMockFactory = new UsersApiMockFactory();
    const projectApiMockFactory: ProjectsApiMockFactory = new ProjectsApiMockFactory();
    let component: ChangeFinishDateDialogComponent;
    let fixture: ComponentFixture<ChangeFinishDateDialogComponent>;


    beforeEach(async(() => {
        user = userApiMockFactroy.createUserDict();
        project = projectApiMockFactory.createProjectDict([], user, []);
        task = new Task(taskApiMockFactory.createTaskDict(user, user, project,  []));
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, ReactiveFormsModule, NoopAnimationsModule],
            declarations: [ChangeFinishDateDialogComponent],
            providers: [{
                provide: MatDialogRef,
                useValue: {
                    close: (dialogResult: any) => {}
                }
            }, {
                provide: MAT_DIALOG_DATA,
                useValue:  {
                        'task': task

                }
            }]})
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChangeFinishDateDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
