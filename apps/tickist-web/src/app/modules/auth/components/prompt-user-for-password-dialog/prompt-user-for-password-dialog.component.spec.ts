import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {PromptUserForPasswordDialogComponent} from './prompt-user-for-password-dialog.component';

describe('PromptUserForPasswordDialogComponent', () => {
    let component: PromptUserForPasswordDialogComponent;
    let fixture: ComponentFixture<PromptUserForPasswordDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
                declarations: [PromptUserForPasswordDialogComponent]
            })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PromptUserForPasswordDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
