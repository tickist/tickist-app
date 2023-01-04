import { clickOnCreateNewProject, clickOnProject, createFirebase, removeOldFirebaseData, userID } from "../../support/utils";

describe("Add Projects", () => {
    beforeEach(() => {
        removeOldFirebaseData();
        cy.login(userID);
        createFirebase();
        cy.visit("/");
    });

    afterEach(() => {
        removeOldFirebaseData();
    });

    describe("Add new projects", () => {
        const newProjectName = "New project";
        const newProjectDescription = "New project description";

        it("should add new project", () => {
            cy.log("Start creating a new project");
            clickOnCreateNewProject();
            cy.get("input[name=projectName]", { timeout: 600000 }).type(newProjectName);
            cy.get("textarea[name=projectDescription]").type(newProjectDescription);
            cy.get('[data-cy="save project"]').click();
            clickOnProject(newProjectName);
            cy.url().should("include", "tasks-projects-view");
            cy.get("tickist-tasks-from-projects").should("contain", newProjectName);
            cy.get("tickist-tasks-from-projects").should("contain", newProjectDescription);
            cy.get("tickist-tasks-from-projects").should("contain", "Tasks list is empty");
        });

        it.only("should add new project with ancestor", () => {
            const ancestorName = "Project 1";
            cy.log("Start creating a new project with ancestor");
            clickOnCreateNewProject();
            cy.get("input[name=projectName]", { timeout: 600000 }).type(newProjectName);
            cy.get('mat-select[data-cy="select-ancestor"]', { timeout: 600000 }).click();
            cy.get("mat-option", { timeout: 600000 }).contains(ancestorName).click();
            cy.get('mat-select[data-cy="select-project-type"]', { timeout: 600000 }).should("has.class", "mat-select-disabled");
            cy.get('[data-cy="save project"]', { timeout: 600000 }).click();
            cy.get(`tickist-single-project:contains(${ancestorName})`, { timeout: 600000 }).then(($project) => {
                expect($project.next()).to.contain.text(newProjectName);
                expect($project.next()).to.contain.text("0");
            });
        });
    });
});
