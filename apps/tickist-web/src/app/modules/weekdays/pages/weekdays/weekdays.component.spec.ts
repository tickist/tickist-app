import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { MockProjectService } from "../../../../testing/mocks/project-service";
import { MockConfigurationService } from "../../../../testing/mocks/configurationService";
import { TickistMaterialModule } from "../../../../material.module";

import { NO_ERRORS_SCHEMA } from "@angular/core";
import { WeekdaysComponent } from "./weekdays.component";
import { MockTaskService } from "../../../../testing/mocks/task-service";
import { MockUserService } from "../../../../testing/mocks/userService";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";
import { StoreModule } from "@ngrx/store";
import { RouterTestingModule } from "@angular/router/testing";

let comp: WeekdaysComponent;
let fixture: ComponentFixture<WeekdaysComponent>;

describe("Component: Dashboard", () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const userService = new MockUserService();
        const tasksService = new MockTaskService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, RouterTestingModule, FlexLayoutModule, StoreModule.forRoot({})],
            declarations: [WeekdaysComponent],
            providers: [
                projectService.getProviders(),
                userService.getProviders(),
                tasksService.getProviders(),
                configurationService.getProviders(),
            ],
            schemas: [NO_ERRORS_SCHEMA],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(WeekdaysComponent);
                comp = fixture.componentInstance;
            });
    }));
    it("should create an instance", () => {
        expect(comp).toBeTruthy();
    });
});
