import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LeftPanelComponent} from './left-panel.component';
import {TickistMaterialModule} from '../../../../material.module';
import {MockComponent} from 'ng-mocks';
import {FutureListComponent} from '../../components/future-list/future-list.component';
import {WeekDaysComponent} from '../../components/weekdays/weekdays.component';
import {TickistProjectListModule} from '../../modules/projects-list/projects-list.module';
import {TickistTagsListModule} from '../../modules/tags-list/tags-list.module';
import {StoreModule} from '@ngrx/store';
import {ProjectsListComponent} from '../../modules/projects-list/components/projects-list/projects-list.component';
import {TagsListComponent} from '../../modules/tags-list/components/tags-list/tags-list.component';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('LeftPanelComponent', () => {
    let component: LeftPanelComponent;
    let fixture: ComponentFixture<LeftPanelComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, StoreModule.forRoot({}), RouterModule.forRoot([]), NoopAnimationsModule],
            declarations: [LeftPanelComponent, MockComponent(FutureListComponent), MockComponent(WeekDaysComponent),
                MockComponent(ProjectsListComponent), MockComponent(TagsListComponent)],
            providers: [
                {provide: APP_BASE_HREF, useValue: '/'},
            ]

        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LeftPanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
