import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { SnackBarMessageComponent } from "./snack-bar-message.component";
import { TickistMaterialModule } from "../../material.module";
import { MatSnackBarModule as MatSnackBarModule } from "@angular/material/snack-bar";

describe("SnackBarMessageComponent", () => {
    let component: SnackBarMessageComponent;
    let fixture: ComponentFixture<SnackBarMessageComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, MatSnackBarModule],
            declarations: [SnackBarMessageComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SnackBarMessageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
