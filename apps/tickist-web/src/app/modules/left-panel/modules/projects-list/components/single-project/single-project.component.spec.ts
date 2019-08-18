/* tslint:disable:no-unused-variable */
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {APP_BASE_HREF} from '@angular/common';
import {By} from '@angular/platform-browser';
import {DebugElement} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SingleProjectComponent} from './single-project.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';
import {MockProjectService} from '../../../../../../testing/mocks/project-service';
import {MockConfigurationService} from '../../../../../../testing/mocks/configurationService';
import {MockUserService} from '../../../../../../testing/mocks/userService';
import {BlankComponent, RootComponent} from '../../../../../../testing/test.modules';
import {TickistMaterialModule} from '../../../../../../material.module';
import {MenuButtonComponent} from '../../../../../../shared/components/menu-button/menu-button.component';
import {MediaObserver} from '@angular/flex-layout';
import {StoreModule} from '@ngrx/store';


let comp: SingleProjectComponent;
let fixture: ComponentFixture<SingleProjectComponent>;


export const routes: Routes = [
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
        path: 'login',
        component: BlankComponent
    }
];

class MediaObserverMock {
}

describe('SingleProjectComponent', () => {

    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const configurationService = new MockConfigurationService();
        const userService = new MockUserService();

        TestBed.configureTestingModule({
            imports: [
                TickistMaterialModule,
                ReactiveFormsModule,
                FormsModule,
                RouterModule.forRoot(routes),
                NoopAnimationsModule,
                StoreModule.forRoot({})
            ],
            declarations: [SingleProjectComponent, RootComponent, BlankComponent, MenuButtonComponent],
            providers: [
                userService.getProviders(),
                projectService.getProviders(),
                configurationService.getProviders(),
                {provide: MediaObserver, useClass: MediaObserverMock}
            ]
        })
            .compileComponents().then(() => {
            fixture = TestBed.createComponent(SingleProjectComponent);
            comp = fixture.componentInstance;
        });
    }));


    it('should be created', () => {
        expect(comp).toBeTruthy();
    });
});
