import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { ToggleButtonComponent } from "./toggle-button.component";
import { TickistMaterialModule } from "../../material.module";
import { IconsModule } from "../../icons.module";

describe("ToggleButtonComponent", () => {
    let component: ToggleButtonComponent;
    let fixture: ComponentFixture<ToggleButtonComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, IconsModule],
            declarations: [ToggleButtonComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ToggleButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
