import {TestBed, ComponentFixture, async} from '@angular/core/testing';

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TickistMaterialModule} from '../../material.module';
import {DeleteTaskDialogComponent} from './delete-task.dialog.component';
import {MockProjectService} from '../../testing/mocks/project-service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

let comp: DeleteTaskDialogComponent;
let fixture: ComponentFixture<DeleteTaskDialogComponent>;


describe('Component: DeleteTaskDialog', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [DeleteTaskDialogComponent],
            providers: [
                {provide : MatDialogRef, useValue : {}},
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        'task': {}

                    }
                }
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(DeleteTaskDialogComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
