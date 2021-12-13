import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AuthLayoutComponent } from "./auth-layout.component";
import { MockComponent } from "ng-mocks";
import { NavBarAuthPageComponent } from "../../header/nav-bar-auth-page/nav-bar-auth-page.component";
import { RouterTestingModule } from "@angular/router/testing";

describe("DialogLayoutComponent", () => {
    let component: AuthLayoutComponent;
    let fixture: ComponentFixture<AuthLayoutComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            declarations: [
                AuthLayoutComponent,
                MockComponent(NavBarAuthPageComponent),
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AuthLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
