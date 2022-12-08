import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ChangeFinishDateDialogComponent } from "./change-finish-date-dialog.component";
import { TickistMaterialModule } from "../../material.module";
import { ReactiveFormsModule } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from "@angular/material/legacy-dialog";

describe("ChangeFinishDateDialogComponent", () => {
    let component: ChangeFinishDateDialogComponent;
    let fixture: ComponentFixture<ChangeFinishDateDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                TickistMaterialModule,
                ReactiveFormsModule,
                NoopAnimationsModule,
            ],
            declarations: [ChangeFinishDateDialogComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: {
                        close: (dialogResult: any) => {},
                    },
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        task: task,
                    },
                },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChangeFinishDateDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
