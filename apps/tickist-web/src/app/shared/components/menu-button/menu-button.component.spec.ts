import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { MenuButtonComponent } from "./menu-button.component";
import { IconsModule } from "../../../icons.module";

describe("MenuButtonComponent", () => {
    let component: MenuButtonComponent;
    let fixture: ComponentFixture<MenuButtonComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [IconsModule],
            declarations: [MenuButtonComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MenuButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
