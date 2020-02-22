import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FutureListComponent} from './future-list.component';
import {FormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistMaterialModule} from '../../../../material.module';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MockUserService} from '../../../../testing/mocks/userService';
import {MockTaskService} from '../../../../testing/mocks/task-service';
import {MockConfigurationService} from '../../../../testing/mocks/configurationService';
import {StoreModule} from '@ngrx/store';
import {RouterTestingModule} from '@angular/router/testing';


describe('FutureListComponent', () => {
    let component: FutureListComponent;
    let fixture: ComponentFixture<FutureListComponent>;

    beforeEach(async(() => {
        const userService = new MockUserService();
        const taskService = new MockTaskService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [
                RouterTestingModule,
                FormsModule, FlexLayoutModule,
                TickistMaterialModule,
                NoopAnimationsModule,
                StoreModule.forRoot({})
            ],
            declarations: [FutureListComponent],
            providers: [
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
