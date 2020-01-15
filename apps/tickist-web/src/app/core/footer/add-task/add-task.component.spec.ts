/* tslint:disable:no-unused-variable */
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {DebugElement} from '@angular/core';
import {APP_BASE_HREF} from '@angular/common';
import {AddTaskComponent} from './add-task.component';
import {RouterModule, Routes} from '@angular/router';
import {RootComponent, BlankComponent} from '../../../testing/test.modules';
import {StoreModule} from '@ngrx/store';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {RouterTestingModule} from '@angular/router/testing';
import {IconsModule} from '../../../icons.module';

const routes: Routes = [
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
        path: 'home/task',
        component: BlankComponent
    }
];

describe('AddTaskComponent', () => {
    let component: AddTaskComponent;
    let fixture: ComponentFixture<AddTaskComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule.withRoutes(routes), StoreModule.forRoot({}), IconsModule],
            declarations: [AddTaskComponent, RootComponent, BlankComponent],
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(AddTaskComponent);
            component = fixture.componentInstance;
        });
    }));
    it('should create', () => {
        expect(component).toBeTruthy();
    });

});
