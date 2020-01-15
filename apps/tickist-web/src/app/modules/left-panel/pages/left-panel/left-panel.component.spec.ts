import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LeftPanelComponent} from './left-panel.component';
import {TickistMaterialModule} from '../../../../material.module';
import {MockComponent} from 'ng-mocks';
import {FutureListComponent} from '../../components/future-list/future-list.component';
import {WeekDaysComponent} from '../../components/weekdays/weekdays.component';
import {StoreModule} from '@ngrx/store';
import {ProjectsListComponent} from '../../modules/projects-list/pages/projects-list/projects-list.component';
import {TagsListComponent} from '../../modules/tags-list/pages/tags-list/tags-list.component';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {IconsModule} from '../../../../icons.module';

describe('LeftPanelComponent', () => {
    let component: LeftPanelComponent;
    let fixture: ComponentFixture<LeftPanelComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, StoreModule.forRoot({}), RouterTestingModule, NoopAnimationsModule, IconsModule],
            declarations: [LeftPanelComponent, MockComponent(FutureListComponent), MockComponent(WeekDaysComponent),
                MockComponent(ProjectsListComponent), MockComponent(TagsListComponent)],
            providers: [
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
