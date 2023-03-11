import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { MockComponent } from "ng-mocks";
import { TasksFromProjectsComponent } from "./tasks-from-projects.component";
import { ChangeTaskViewComponent } from "../../../../shared/components/change-task-view-component/change-task-view.component";
import { TickistMaterialModule } from "../../../../material.module";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";
import { MenuButtonComponent } from "../../../../shared/components/menu-button/menu-button.component";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { SingleTaskComponent } from "../../../../single-task/single-task/single-task.component";
import { TaskNameComponent } from "../../../../single-task/task-name/task-name.component";
import { PinButtonComponent } from "../../../../single-task/pin-button/pin-button.component";
import { DateOptionsComponent } from "../../../../single-task/date-options/date-options.component";
import { EditRepeatingOptionComponent } from "../../../../single-task/edit-repeating-options/edit-repeating-option.component";
import { ProgressBarComponent } from "../../../../single-task/progress-bar/progress-bar.component";
import { DisplayFinishDateComponent } from "../../../../single-task/display-finish-date/display-finish-date.component";
import { UserAvatarComponent } from "../../../../single-task/user-avatar/user-avatar.component";
import { RightMenuComponent } from "../../../../single-task/right-menu/right-menu.component";
import { ToggleButtonComponent } from "../../../../single-task/toggle-button/toggle-button.component";
import { TruncatePipe } from "../../../../shared/pipes/truncate.pipe";
import { Minutes2hoursPipe } from "../../../../shared/pipes/minutes2hours";
import { AvatarSize } from "../../../../shared/pipes/avatarSize";
import { MockTaskService } from "../../../../testing/mocks/task-service";
import { MockProjectService } from "../../../../testing/mocks/project-service";
import { MockConfigurationService } from "../../../../testing/mocks/configurationService";
import { APP_BASE_HREF } from "@angular/common";
import { MockActivatedRoute } from "../../../../testing/mocks/activatedRoute";
import { MockUserService } from "../../../../testing/mocks/userService";
import { MockTagService } from "../../../../testing/mocks/tag-service";
import { MockTasksFiltersService } from "../../../../testing/mocks/tasks-filters-service";
import { BlankComponent, RootComponent } from "../../../../testing/test.modules";
import { PriorityComponent } from "../../../../shared/components/priority/priority.component";
import { SortTasksComponent } from "../../../../tasks/sort-tasks/sort-tasks.component";
import { FilterTasksComponent } from "../../../../tasks/filter-tasks/filter-tasks.component";
import { SingleTaskSimplifiedComponent } from "../../../../single-task/single-task-simplified/single-task-simplified.component";
import { NoTasksComponent } from "../../../../single-task/no-tasks/no-tasks.component";
import { StoreModule } from "@ngrx/store";
import { RouterTestingModule } from "@angular/router/testing";

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

describe("TasksFromProjectsComponent", () => {
    let component: TasksFromProjectsComponent;
    let fixture: ComponentFixture<TasksFromProjectsComponent>;

    beforeEach(async(() => {
        const configurationService = new MockConfigurationService();
        const projectService = new MockProjectService();
        const taskService = new MockTaskService();
        const tasksFiltersService = new MockTasksFiltersService();
        const tagService = new MockTagService();
        const userService = new MockUserService();
        const activatedRoute = new MockActivatedRoute();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, FlexLayoutModule, RouterTestingModule, FormsModule, StoreModule.forRoot({})],
            declarations: [
                TasksFromProjectsComponent,
                ChangeTaskViewComponent,
                FilterTasksComponent,
                MockComponent(SortTasksComponent),
                MockComponent(MenuButtonComponent),
                MockComponent(SingleTaskSimplifiedComponent),
                MockComponent(SingleTaskComponent),
                MockComponent(TaskNameComponent),
                MockComponent(PinButtonComponent),
                MockComponent(DateOptionsComponent),
                MockComponent(RightMenuComponent),
                MockComponent(EditRepeatingOptionComponent),
                MockComponent(ProgressBarComponent),
                MockComponent(DisplayFinishDateComponent),
                MockComponent(UserAvatarComponent),
                MockComponent(PriorityComponent),
                MockComponent(NoTasksComponent),
                MockComponent(ToggleButtonComponent),
                TruncatePipe,
                Minutes2hoursPipe,
                AvatarSize,
                RootComponent,
                BlankComponent,
            ],
            providers: [
                configurationService.getProviders(),
                projectService.getProviders(),
                tasksFiltersService.getProviders(),
                taskService.getProviders(),
                tagService.getProviders(),
                userService.getProviders(),
                activatedRoute.getProviders(),
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TasksFromProjectsComponent);
        component = fixture.componentInstance;
    });

    it("should be created", () => {
        expect(component).toBeTruthy();
    });
});
