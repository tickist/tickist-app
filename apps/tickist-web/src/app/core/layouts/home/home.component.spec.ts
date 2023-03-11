/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { HomeComponent } from "./home.component";
import { BlankComponent, RootComponent } from "../../../testing/test.modules";
import { MockTaskService } from "../../../testing/mocks/task-service";
import { MockConfigurationService } from "../../../testing/mocks/configurationService";
import { MockTagService } from "../../../testing/mocks/tag-service";
import { MockUserService } from "../../../testing/mocks/userService";
import { MockProjectService } from "../../../testing/mocks/project-service";
import { Routes } from "@angular/router";
import { MockComponent } from "ng-mocks";
import { GlobalStatisticsComponent } from "../../../modules/statistics-view/components/global-statistics/global-statistics.component";
import { TickistMaterialModule } from "../../../material.module";
import { FlexLayoutModule, MediaObserver } from "@ngbracket/ngx-layout";
import { NavComponent } from "../../header/nav-component/nav.component";
import { ActionReducerMap, StoreModule } from "@ngrx/store";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Observable } from "rxjs";
import { RouterTestingModule } from "@angular/router/testing";
import { AddTaskFooterButtonComponent } from "../../footer/add-task-footer-button/add-task-footer-button.component";

const routes: Routes = [
    {
        path: "",
        redirectTo: "home",
        pathMatch: "full",
    },
    {
        path: "home",
        component: RootComponent,
    },
    {
        path: "home/task",
        component: BlankComponent,
    },
];

const reducers: ActionReducerMap<any> = {};

class MediaObserverMock {
    media$ = new Observable<any>();
}

describe("Component: Home", () => {
    let component: HomeComponent;
    let fixture: ComponentFixture<HomeComponent>;
    let configurationService;

    beforeEach(async(() => {
        const userService = new MockUserService();
        const taskService = new MockTaskService();
        const tagService = new MockTagService();
        configurationService = new MockConfigurationService();
        const projectService = new MockProjectService();

        TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes(routes),
                FlexLayoutModule,
                TickistMaterialModule,
                NoopAnimationsModule,
                StoreModule.forRoot(reducers, {
                    initialState: {},
                }),
            ],
            declarations: [
                HomeComponent,
                RootComponent,
                BlankComponent,
                MockComponent(AddTaskFooterButtonComponent),
                MockComponent(GlobalStatisticsComponent),
                MockComponent(NavComponent),
            ],
            providers: [
                userService.getProviders(),
                taskService.getProviders(),
                tagService.getProviders(),
                configurationService.getProviders(),
                projectService.getProviders(),
                { provide: MediaObserver, useClass: MediaObserverMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(HomeComponent);
        component = fixture.componentInstance;
    }));

    afterEach(() => {
        fixture = null;
        component = null;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
