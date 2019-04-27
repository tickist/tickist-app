import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {AuthLayoutComponent} from './auth-layout.component';
import {TickistCoreModule} from '../../core.module';
import {MockComponent} from 'ng-mocks';
import {NavBarAuthPageComponent} from '../../header/nav-bar-auth-page/nav-bar-auth-page.component';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';

describe('DialogLayoutComponent', () => {
    let component: AuthLayoutComponent;
    let fixture: ComponentFixture<AuthLayoutComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                RouterModule.forRoot([])
            ],
            declarations: [
                AuthLayoutComponent,
                MockComponent(NavBarAuthPageComponent)
            ],
            providers: [
                {provide: APP_BASE_HREF, useValue: '/'}
            ],
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AuthLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
