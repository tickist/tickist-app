import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ProjectTreeComponent} from './project-tree.component';
import {TickistMaterialModule} from '../../../../material.module';
import {TickistSharedModule} from '../../../../shared/shared.module';
import {RouterModule} from '@angular/router';
import {APP_BASE_HREF} from '@angular/common';
import {FlexLayoutModule} from '@angular/flex-layout';
import {CdkTree, CdkTreeModule} from '@angular/cdk/tree';
import {MatBadgeModule, MatIconModule, MatToolbarModule, MatTreeModule, MatTreeNodeToggle} from '@angular/material';
import {TickistSingleTaskModule} from '../../../../single-task/single-task.module';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('ProjectTreeComponent', () => {
    let component: ProjectTreeComponent;
    let fixture: ComponentFixture<ProjectTreeComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                TickistSharedModule,
                CdkTreeModule,
                MatTreeModule,
                TickistSingleTaskModule,
                RouterModule.forRoot([]),
                MatBadgeModule,
                MatIconModule,
                MatToolbarModule
            ],
            declarations: [ProjectTreeComponent],
            providers: [
                {provide: APP_BASE_HREF, useValue: '/'}
            ],
            schemas: [NO_ERRORS_SCHEMA]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProjectTreeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
