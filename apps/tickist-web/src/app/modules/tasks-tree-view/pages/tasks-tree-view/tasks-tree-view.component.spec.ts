import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {TickistMaterialModule} from '../../../../material.module';
import {TasksTreeViewComponent} from './tasks-tree-view.component';
import {MockComponent} from 'ng-mocks';
import {ProjectTreeComponent} from '../../components/project-tree/project-tree.component';
import {AddTaskTreeViewComponent} from '../../components/add-task-tree-view/add-task-tree-view.component';
import {TickistSingleTaskModule} from '../../../../single-task/single-task.module';
import {StoreModule} from '@ngrx/store';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {IconsModule} from '../../../../icons.module';


describe('TasksTreeViewMainViewComponent', () => {
    let component: TasksTreeViewComponent;
    let fixture: ComponentFixture<TasksTreeViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                TickistMaterialModule,
                TickistSingleTaskModule,
                StoreModule.forRoot({}),
                IconsModule,
                RouterTestingModule
            ],
            declarations: [
                TasksTreeViewComponent,
                MockComponent(ProjectTreeComponent),
                MockComponent(AddTaskTreeViewComponent)
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TasksTreeViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
