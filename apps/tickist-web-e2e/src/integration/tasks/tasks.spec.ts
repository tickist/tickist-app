import {
    clickMenuElement,
    clickOnProject,
    clickOnWeekDay,
    compareTaskElementWithTaskObject,
    createFirebase,
    login,
    removeOldFirebaseData,
} from "../../support/utils";
import { TaskProject } from "@data/tasks/models/task-project";
import { Task } from "@data/tasks/models/tasks";
import { createUniqueId } from "@tickist/utils";
import { addDays, format } from "date-fns";
import { Step } from "@data/tasks/models/steps";
import { TaskType } from "@data";

describe("Tasks", () => {
    beforeEach(() => {
        login();
        createFirebase();
    });

    afterEach(() => {
        removeOldFirebaseData();
    });

    describe("Click on add new task button", () => {
        let task: any;
        beforeEach(() => {
            task = {
                name: "Task 3",
                priority: "A",
                description: "Task description",
                tags: [],
                finishDate: new Date(),
                finishTime: "10:00",
                taskProject: <Partial<TaskProject>>{ name: "Inbox" },
                steps: [{ name: "step 1" }, { name: "step 2" }],
            };
        });

        it("should open the form, fills the form and next add new task to the Inbox", () => {
            cy.get("tickist-add-task-footer-button", { timeout: 20000 })
                .find("button")
                .click();
            cy.url().should("include", "home").should("include", "edit-task");

            cy.log("fill main form");
            cy.get("input[name=taskName]", { timeout: 20000 })
                .type("Task 3")
                .should("have.value", "Task 3");
            cy.get("tickist-priority").find("button").contains("A").click();

            cy.get("input[name=finishDate]").focus();
            cy.get("mat-calendar").find(".mat-calendar-body-today").click();
            // cy.get('body').type('{esc}');
            cy.get("input[name=finishTime]")
                .type("10:00")
                .should("have.value", "10:00");

            cy.log("fill repeat form");
            clickMenuElement("Repeat");
            cy.get("mat-radio-group").contains("monthly").click();

            cy.log("fill steps");
            clickMenuElement("Steps");
            cy.get("#steps")
                .find("input")
                .last()
                .type("step 1")
                .should("have.value", "step 1");
            cy.get("#add-step").contains("Add new step").click();
            cy.get("#steps").find("input").last().type("step 2");
            // extra
            clickMenuElement("Extra");

            cy.get("textarea")
                .type("Task description")
                .should("have.value", "Task description");

            cy.get("button[type='submit']").click();

            cy.url().should("include", "home").should("include", "weekdays");
            clickOnProject("Inbox");

            cy.get('tickist-single-task:contains("Task 3")').then(($task) => {
                compareTaskElementWithTaskObject($task, task);
            });
        });
    });

    describe("Tasks with steps", () => {
        const taskWithStepsName = "Task with steps";
        let taskWithStepsNameProjectName;

        beforeEach(() => {
            cy.get("@database").then((database: any) => {
                taskWithStepsNameProjectName = database.projects[0].name;
                const task = new Task({
                    id: createUniqueId(),
                    name: taskWithStepsName,
                    owner: database.user,
                    ownerPk: database.uid,
                    priority: database.projects[0].defaultPriority,
                    author: database.user,
                    taskListPk: database.projects[0].id,
                    repeat: 0,
                    repeatDelta: 0,
                    fromRepeating: 1,
                    taskType: TaskType.normal,
                    taskProject: {
                        id: database.projects[0].id,
                        name: database.projects[0].name,
                        color: database.projects[0].color,
                        shareWithIds: database.projects[0].shareWithIds,
                        icon: database.projects[0].icon,
                    },
                    steps: [
                        new Step({
                            id: createUniqueId(),
                            name: "step 1",
                            status: 0,
                        }),
                        new Step({
                            id: createUniqueId(),
                            name: "step 2",
                            status: 0,
                        }),
                        new Step({
                            id: createUniqueId(),
                            name: "step 3",
                            status: 0,
                        }),
                        new Step({
                            id: createUniqueId(),
                            name: "step 4",
                            status: 0,
                        }),
                    ],
                });
                cy.callFirestore(
                    "set",
                    `tasks/${task.id}`,
                    JSON.parse(JSON.stringify(task))
                );
            });
        });

        it("should change task status to done. when all steps are finished", () => {
            clickOnProject(taskWithStepsNameProjectName);
            cy.get(`tickist-single-task:contains("${taskWithStepsName}")`).then(
                ($task) => {
                    cy.log("Click on progress bar");
                    cy.wrap($task.find("tickist-progress-bar")).click();
                }
            );

            cy.get("#steps")
                .find('[data-cy="stepIsUndone"]')
                .first()
                .then(($elem) => {
                    cy.wrap($elem).click({ force: true });
                });
            cy.get("#steps")
                .find('[data-cy="stepIsDone"]')
                .should("have.length", 1);

            cy.get("#steps")
                .find('[data-cy="stepIsUndone"]')
                .first()
                .then(($elem) => {
                    cy.wrap($elem).click({ force: true });
                });
            cy.get("#steps")
                .find('[data-cy="stepIsDone"]')
                .should("have.length", 2);

            cy.get("#steps")
                .find('[data-cy="stepIsUndone"]')
                .first()
                .then(($elem) => {
                    cy.wrap($elem).click({ force: true });
                });
            cy.get("#steps")
                .find('[data-cy="stepIsDone"]')
                .should("have.length", 3);

            cy.get("#steps")
                .find('[data-cy="stepIsUndone"]')
                .first()
                .then(($elem) => {
                    cy.wrap($elem).click({ force: true });
                });
            cy.get(
                `tickist-single-task:contains("${taskWithStepsName}")`
            ).should("not.exist");
        });
    });

    describe("Change task status", () => {
        it("should change task status to done after click on tickist-toggle-button", () => {
            const newTaskName = "new task";
            cy.log("Create new task");
            cy.get("tickist-add-task-footer-button").find("button").click();
            cy.url().should("include", "home").should("include", "edit-task");
            cy.log("fill main form");
            cy.get("input[name=taskName]").type(newTaskName);
            cy.get("button[type='submit']").click();

            clickOnProject("Inbox");

            cy.get(`tickist-single-task:contains("${newTaskName}")`).then(
                ($task) => {
                    cy.wrap($task.find("tickist-toggle-button")).click();
                }
            );
            cy.get(`tickist-single-task:contains("${newTaskName}")`).should(
                "not.exist"
            );
            cy.get("simple-snack-bar").should("exist");
        });

        describe("Change finish date", () => {
            const taskName = "Task with finish date";
            let projectName;

            beforeEach(() => {
                cy.get("@database").then((database: any) => {
                    projectName = database.projects[0].name;
                    const task = new Task({
                        id: createUniqueId(),
                        name: taskName,
                        owner: database.user,
                        ownerPk: database.uid,
                        priority: database.projects[0].defaultPriority,
                        author: database.user,
                        taskListPk: database.projects[0].id,
                        finishDate: new Date(),
                        repeat: 1,
                        repeatDelta: 7,
                        fromRepeating: 1,
                        taskType: TaskType.normal,
                        taskProject: {
                            id: database.projects[0].id,
                            name: database.projects[0].name,
                            color: database.projects[0].color,
                            shareWithIds: database.projects[0].shareWithIds,
                            icon: database.projects[0].icon,
                        },
                    });
                    cy.callFirestore(
                        "set",
                        `tasks/${task.id}`,
                        JSON.parse(JSON.stringify(task))
                    );
                });
            });

            it("should change finish date when task has enabled repeat options", () => {
                cy.get(`tickist-single-task:contains("${taskName}")`).then(
                    ($task) => {
                        cy.wrap($task.find("tickist-toggle-button")).click();
                    }
                );
                clickOnProject(projectName);
                cy.get(`tickist-single-task:contains("${taskName}")`).then(
                    ($task) => {
                        cy.wrap($task.find("tickist-display-finish-date"))
                            .contains(
                                format(addDays(new Date(), 7), "dd-MM-yyyy")
                            )
                            .should("exist");
                    }
                );
            });
        });
    });

    describe("Pin task", () => {
        it("should pinned task after click on pin icon next unpinned task after again click on pin icon", () => {
            cy.get('tickist-single-task:contains("Task 4")').should(
                "not.exist"
            );
            clickOnProject("Project 2");
            cy.get('tickist-single-task:contains("Task 4")').then(($task) => {
                cy.wrap($task.find("#first-row"))
                    .trigger("mouseenter")
                    .wrap($task.find("tickist-pin-button"))
                    .click();
            });
            clickOnWeekDay("today");

            cy.get('tickist-single-task:contains("Task 4")').then(($task) => {
                // eslint-disable-next-line no-unused-expressions, @typescript-eslint/no-unused-expressions
                expect($task.find("tickist-pin-button")).to.be.visible;
                cy.wrap($task.find("#first-row"))
                    .trigger("mouseenter")
                    .wrap($task.find("tickist-pin-button"))
                    .click();
            });
            cy.get('tickist-single-task:contains("Task 4")').should(
                "not.exist"
            );
        });
    });

    describe("Change task assigned to", () => {});
});
