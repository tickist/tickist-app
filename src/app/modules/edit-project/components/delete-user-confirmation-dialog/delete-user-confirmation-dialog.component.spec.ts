import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {DeleteUserConfirmationDialogComponent} from './delete-user-confirmation-dialog.component';
import {TickistMaterialModule} from '../../../../material.module';
import {ReactiveFormsModule} from '@angular/forms';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

describe('DeleteUserConfirmationDialogComponent', () => {
    let component: DeleteUserConfirmationDialogComponent;
    let fixture: ComponentFixture<DeleteUserConfirmationDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, ReactiveFormsModule, NoopAnimationsModule],
            declarations: [DeleteUserConfirmationDialogComponent],
            providers: [{
                provide: MatDialogRef,
                useValue: {
                    close: (dialogResult: any) => {
                    }
                }
            }, {
                provide: MAT_DIALOG_DATA,
            }]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DeleteUserConfirmationDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
