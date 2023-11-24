import { EditRepeatingOptionComponent } from "./edit-repeating-option.component";
import { async, ComponentFixture, fakeAsync, inject, TestBed } from "@angular/core/testing";
import { MockConfigurationService } from "../../testing/mocks/configurationService";
import { TickistMaterialModule } from "../../material.module";
import { FormsModule } from "@angular/forms";
import { ConfigurationService } from "../../core/services/configuration.service";
import { Task } from "@data/tasks/models/tasks";
import { UsersApiMockFactory } from "../../testing/mocks/api-mock/users-api-mock.factory";
import { ProjectsApiMockFactory } from "../../testing/mocks/api-mock/projects-api-mock.factory";
import { provideMockStore } from "@ngrx/store/testing";
import { requestUpdateTask } from "../../core/actions/tasks/task.actions";
import { Store } from "@ngrx/store";

let comp: EditRepeatingOptionComponent;
let fixture: ComponentFixture<EditRepeatingOptionComponent>;
let task: Task;

describe("Edit repeating Component", () => {
    let store: any;
    let user: any;
    let project: any;
    const userApiMockFactroy: UsersApiMockFactory = new UsersApiMockFactory();
    const projectApiMockFactory: ProjectsApiMockFactory = new ProjectsApiMockFactory();

    beforeEach(async(() => {
        const initialState = {};
        user = userApiMockFactroy.createUserDict();
        project = projectApiMockFactory.createProjectDict([], user, []);
        task = new Task({
            name: "Task 1",
            taskProject: { id: "1", name: "inbox", shareWithIds: [], color: "" },
            owner: user,
            priority: "A",
            ownerPk: user.id,
            author: user,
            taskListPk: project.id,
        });

        const configurationService = new MockConfigurationService();
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, FormsModule],
            declarations: [EditRepeatingOptionComponent],
            providers: [provideMockStore({ initialState }), configurationService.getProviders()],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(EditRepeatingOptionComponent);
                comp = fixture.componentInstance;
            });
    }));
    afterEach(() => {
        comp = null;
        fixture = null;
        task = null;
    });
    it("should create", () => {
        expect(comp).toBeTruthy();
    });
    describe("ngOnInit", () => {
        it("should set three variables", fakeAsync(
            inject([ConfigurationService], (configurationService: ConfigurationService) => {
                expect(comp.defaultRepeatOptions).toBeFalsy();
                expect(comp.customRepeatOptions).toBeFalsy();
                expect(comp.fromRepeatingOptions).toBeFalsy();
                comp.task = task;
                comp.ngOnInit();
                expect(comp.defaultRepeatOptions).toBe(configurationService.loadConfiguration()["commons"]["DEFAULT_REPEAT_OPTIONS"]);
                expect(comp.customRepeatOptions).toBe(configurationService.loadConfiguration()["commons"]["CUSTOM_REPEAT_OPTIONS"]);
                expect(comp.fromRepeatingOptions).toBe(configurationService.loadConfiguration()["commons"]["FROM_REPEATING_OPTIONS"]);
            }),
        ));

        it("should throw an exception when task is null or undefined", () => {
            expect(() => {
                comp.ngOnInit();
            }).toThrow(new Error("Task cannot be null"));
        });
    });

    describe("saveTask", () => {
        beforeEach(() => {
            store = TestBed.inject(Store);
            store.dispatch = jest.spyOn(store, "dispatch");
        });
        it("should dispatch action requestUpdateTask", () => {
            comp.task = task;
            comp.ngOnInit();
            comp.saveTask({ value: 1 }, "repeatDefault");
            task = Object.assign({}, task, { repeat: 1, repeatDelta: 1 });
            expect(store.dispatch).toHaveBeenCalledWith(requestUpdateTask({ task: { id: task.id, changes: task } }));
        });

        it("should update task model when the repeat default is changed (scenario 1. -> default repeat )", () => {
            const taskRepeat = 2;
            comp.task = task;
            comp.ngOnInit();
            comp.saveTask({ value: taskRepeat }, "repeatDefault");
            expect(store.dispatch).toHaveBeenCalledWith(
                requestUpdateTask({
                    task: {
                        id: task.id,
                        changes: Object.assign({}, task, { repeat: taskRepeat, repeatDelta: 1 }),
                    },
                }),
            );
        });

        it("should update task model when the repeat default is changed (scenario 2. -> repeat custom)", () => {
            const taskRepeat = 99;
            const repeatDelta = 5;
            const repeatCustom = 4;
            comp.task = task;
            comp.ngOnInit();
            comp.repeatDelta = repeatDelta;
            comp.repeatCustom = repeatCustom;
            comp.saveTask({ value: taskRepeat }, "repeatDefault");
            expect(store.dispatch).toHaveBeenCalledWith(
                requestUpdateTask({
                    task: {
                        id: task.id,
                        changes: Object.assign({}, task, { repeat: repeatCustom, repeatDelta: repeatDelta }),
                    },
                }),
            );
        });
    });
});
