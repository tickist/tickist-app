import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {RightMenuComponent} from './right-menu.component';
import {TickistMaterialModule} from '../../material.module';
import {Component, Input} from '@angular/core';
import { MockComponent } from 'mock-component';
import {BlankComponent, RootComponent} from '../../testing/test.modules';
import {RouterModule, Routes} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {Task} from '../../models/tasks';
import {task1} from '../../testing/mocks/api_mocks/tasks';
import {PinButtonComponent} from '../pin-button/pin-button.component';
import {MenuButtonComponent} from '../../shared/menu-button/menu-button.component';
import {PriorityComponent} from '../../shared/priority/priority.component';


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


describe('RightMenuComponent', () => {
    let component: RightMenuComponent;
    let fixture: ComponentFixture<RightMenuComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, RouterModule.forRoot(routes)],
            declarations: [RightMenuComponent, MockComponent(PinButtonComponent), MockComponent(MenuButtonComponent), 
                MockComponent(PriorityComponent), RootComponent, BlankComponent],
            providers: [
                {provide: APP_BASE_HREF, useValue: '/'}
            ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(RightMenuComponent);
            component = fixture.componentInstance;
        });
    }));


    it('should create', () => {
        component.task = new Task(task1);
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });


    it('should throw an exception', () => {
        component.task = null;
        expect(() => component.ngOnInit()).toThrowError(`Attribute 'task' is required`);
    });
});
