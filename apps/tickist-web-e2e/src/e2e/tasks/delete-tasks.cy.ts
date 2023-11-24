import { Task, TaskType } from "@data";
import { createUniqueId } from "@tickist/utils";
import { clickOnProject, createFirebase, removeOldFirebaseData } from "../../support/utils";

describe("Delete task", () => {
    const deletedTaskName = "Deleted task";
    const nonDeletedTaskName = "Task non deleted";

    beforeEach(() => {
        cy.login("7mr64tVcVv3085oo0Y1VheOQYJXV");
        createFirebase();
        cy.visit("/");
        cy.get("@database").then((database: any) => {
            const deletedTask = new Task({
                id: createUniqueId(),
                name: deletedTaskName,
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
            });
            cy.callFirestore("set", `tasks/${deletedTask.id}`, JSON.parse(JSON.stringify(deletedTask)));

            const nonDeletedTask = new Task({
                id: createUniqueId(),
                name: nonDeletedTaskName,
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
            });
            cy.callFirestore("set", `tasks/${nonDeletedTask.id}`, JSON.parse(JSON.stringify(nonDeletedTask)));
            clickOnProject(database.projects[0].name);
            cy.url().should("include", "/home/tasks-projects-view");
        });
    });

    afterEach(() => {
        removeOldFirebaseData();
    });

    it('should delete task after click on button "delete task" and "Yes"', () => {
        cy.get(`tickist-single-task:contains("${deletedTaskName}")`, {
            timeout: 10000,
        }).then(($task) => {
            cy.wrap($task.find("#first-row")).trigger("mouseenter");
            cy.wrap($task.find('[data-cy="task-short-menu"]')).click();
            cy.get('[data-cy="delete-task-button"]').click();
        });
        cy.get("tickist-delete-task").within(() => {
            cy.get("button").contains("Yes").click();
        });
        cy.get("simple-snack-bar").contains("Task has been deleted successfully").should("exist");
        cy.get(`tickist-single-task:contains("${deletedTaskName}")`).should("not.exist");
    });

    it('should not delete task after click on button "delete task" and "No"', () => {
        cy.get(`tickist-single-task:contains("${nonDeletedTaskName}")`, {
            timeout: 10000,
        }).then(($task) => {
            cy.wrap($task.find("#first-row")).trigger("mouseenter");
            cy.wrap($task.find('[data-cy="task-short-menu"]')).click();
            cy.get('[data-cy="delete-task-button"]').click();
        });
        cy.get("tickist-delete-task").within(() => {
            cy.get("button").contains("No").click();
        });
        cy.get(`tickist-single-task:contains("${nonDeletedTaskName}")`).should("exist");
    });
});
