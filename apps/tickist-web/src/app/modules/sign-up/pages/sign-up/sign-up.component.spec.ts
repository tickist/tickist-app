import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { TickistMaterialModule } from "../../../../material.module";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { SignUpComponent } from "./signup.component";
import { MockUserService } from "../../../../testing/mocks/userService";
import { AuthService } from "../../../auth/services/auth.service";
import { StoreModule } from "@ngrx/store";
import { RouterTestingModule } from "@angular/router/testing";

let comp: SignUpComponent;
let fixture: ComponentFixture<SignUpComponent>;

class AuthServiceMock {}

describe("Component: SignUp", () => {
    beforeEach(async(() => {
        const userService = new MockUserService();

        TestBed.configureTestingModule({
            imports: [
                TickistMaterialModule,
                RouterTestingModule,
                StoreModule.forRoot({}),
            ],
            declarations: [SignUpComponent],
            providers: [
                userService.getProviders(),
                { provide: AuthService, useValue: AuthServiceMock },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(SignUpComponent);
                comp = fixture.componentInstance;
            });
    }));
    it("should create an instance", () => {
        expect(comp).toBeTruthy();
    });
});
