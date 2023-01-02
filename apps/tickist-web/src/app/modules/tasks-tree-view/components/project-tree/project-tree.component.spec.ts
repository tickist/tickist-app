import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ProjectTreeComponent} from './project-tree.component';
import {TickistSharedModule} from '../../../../shared/shared.module';
import {MatBadgeModule} from '@angular/material/badge';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTreeNodeToggle} from '@angular/material/tree';
import {TickistSingleTaskModule} from '../../../../single-task/single-task.module';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {MockDirective} from 'ng-mocks';
import {Project} from '@data/projects';
import { MatMenuModule } from '@angular/material/menu';
import {RouterTestingModule} from '@angular/router/testing';
import {IconsModule} from '../../../../icons.module';

describe('ProjectTreeComponent', () => {
    let component: ProjectTreeComponent;
    let fixture: ComponentFixture<ProjectTreeComponent>;

    beforeEach(async(() => {
         TestBed.configureTestingModule({
            imports: [
                TickistSharedModule,
                TickistSingleTaskModule,
                RouterTestingModule,
                MatBadgeModule,
                MatIconModule,
                MatToolbarModule,
                MatMenuModule,
                IconsModule
            ],
            declarations: [ProjectTreeComponent, MockDirective(MatTreeNodeToggle)],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProjectTreeComponent);
        component = fixture.componentInstance;
        component.project = <Project> {'name': 'Project 1', 'color': 'red'};
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
