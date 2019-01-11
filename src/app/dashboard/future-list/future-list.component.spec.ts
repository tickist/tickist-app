import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {FutureListComponent} from './future-list.component';
import {FormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistMaterialModule} from '../../material.module';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MockUserService} from '../../testing/mocks/userService';
import {MockTaskService} from '../../testing/mocks/task-service';
import {MockTagService} from '../../testing/mocks/tag-service';
import {MockConfigurationService} from '../../testing/mocks/configurationService';
import {APP_BASE_HREF} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [];


describe('FutureListComponent', () => {
    let component: FutureListComponent;
    let fixture: ComponentFixture<FutureListComponent>;

    beforeEach(async(() => {
        const userService = new MockUserService();
        const taskService = new MockTaskService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [ RouterModule.forRoot(routes), FormsModule, FlexLayoutModule, TickistMaterialModule, NoopAnimationsModule],
            declarations: [FutureListComponent],
            providers: [
                {provide: APP_BASE_HREF, useValue: '/'},
                userService.getProviders(),
                taskService.getProviders(),
                configurationService.getProviders(),
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FutureListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
