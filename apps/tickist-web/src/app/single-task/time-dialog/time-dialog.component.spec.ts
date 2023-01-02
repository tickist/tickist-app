import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TimeDialogComponent} from './time-dialog.component';
import {MockProjectService} from '../../testing/mocks/project-service';
import {MockConfigurationService} from '../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

let comp: TimeDialogComponent;
let fixture: ComponentFixture<TimeDialogComponent>;


describe('Component: TimeDialog', () => {
    beforeEach(async(() => {


        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, FormsModule, ReactiveFormsModule],
            declarations: [TimeDialogComponent],
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
            fixture = TestBed.createComponent(TimeDialogComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
