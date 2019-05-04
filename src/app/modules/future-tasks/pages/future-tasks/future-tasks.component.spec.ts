import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {FutureTasksComponent} from './future-tasks.component';
import {TickistMaterialModule} from '../../../../material.module';
import {ReactiveFormsModule} from '@angular/forms';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {FilterFutureTasksComponent} from '../../components/filter-future-tasks/filter-future-tasks.component';
import {MockComponent} from 'ng-mocks';
import {ChangeTaskViewComponent} from '../../../../shared/components/change-task-view-component/change-task-view.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MockTaskService} from '../../../../testing/mocks/task-service';
import {MockConfigurationService} from '../../../../testing/mocks/configurationService';
import {MockFutureTasksFiltersService} from '../../../../testing/mocks/future-tasks-fiters-service';
import {RouterModule, Routes} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {MockUserService} from '../../../../testing/mocks/userService';
import {TickistTasksModule} from '../../../../tasks/tasks.module';
import {TickistSingleTaskModule} from '../../../../single-task/single-task.module';
import {StoreModule} from '@ngrx/store';


describe('FutureTasksComponent', () => {
    let component: FutureTasksComponent;
    let fixture: ComponentFixture<FutureTasksComponent>;
    const routes: Routes = [];

    beforeEach(async(() => {
        const taskService = new MockTaskService();
        const configurationService = new MockConfigurationService();
        const futureTasksFiltersService = new MockFutureTasksFiltersService();
        const userService = new MockUserService();
        TestBed.configureTestingModule({
            imports: [
                RouterModule.forRoot(routes),
                TickistMaterialModule,
                TickistTasksModule,
                TickistSingleTaskModule,
                ReactiveFormsModule,
                FlexLayoutModule,
                NoopAnimationsModule,
                StoreModule.forRoot({})
            ],
            declarations: [FutureTasksComponent, MockComponent(FilterFutureTasksComponent),
                MockComponent(ChangeTaskViewComponent)],
            providers: [
                {provide: APP_BASE_HREF, useValue: '/'},
                taskService.getProviders(),
                configurationService.getProviders(),
                userService.getProviders(),
                futureTasksFiltersService.getProviders()
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FutureTasksComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
