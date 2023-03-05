import {
    clickMenuElement,
    clickOnEditProject,
    clickOnProject,
    clickOnProjectTypeLeftPanelMenu,
    createFirebase,
    login,
    logout,
    removeOldFirebaseData,
} from "../../support/utils";
import { Project, ProjectType } from "@data";
import { createUniqueId } from "@tickist/utils";

describe("Edit Projects", () => {
    beforeEach(() => {
        // // cy.logout();
        // logout();
        // login();
        cy.login("7mr64tVcVv3085oo0Y1VheOQYJXV");
        createFirebase();
        cy.visit("/");
    });

    afterEach(() => {
        removeOldFirebaseData();
    });

    it("should change project name", () => {
        cy.visit("/home/dashboard", { timeout: 600000 });
        const newProjectName = "Project new 1";
        const oldProjectName = "Project 1";
        cy.get(`tickist-single-project:contains(${newProjectName})`).should("not.exist");

        clickOnEditProject(oldProjectName);
        /**
* TODO(@nrwl/cypress): Nesting Cypress commands in a should assertion now throws.
* You should use .then() to chain commands instead.
* More Info: https://docs.cypress.io/guides/references/migration-guide#-should
**/
cy.get("input[name=projectName]")
            .focus()
            .type("{selectall}{backspace}{selectall}{backspace}")
            .then(() => cy.get("input[name=projectName]").should("be.empty"))
            .then(() => cy.get("input[name=projectName]").type(newProjectName))
            .thenselectall}{backspace}{selectall}{backspace}")
            .then(() => cy.get("input[name=projectName]").should("be.empty"))
            .then(() => cy.get("input[name=projectName]").type(newProjectName))
            .then(() => cy.get("input[name=projectName]").should("have.value", newProjectName));
        cy.get('[data-cy="save project"]').click();
        cy.get(`tickist-single-project:contains(${newProjectName})`).should("exist");
        cy.get("tickist-tasks-from-projects").contains(newProjectName).should("exist");

        clickOnEditProject(newProjectName);
    });
});

describe("Change project type", () => {
    let projectName;
    beforeEach(() => {
        createFirebase();

        cy.get("@database").then((database: any) => {
            projectName = "Project with projectType Active";
            const project = new Project({
                id: createUniqueId(),
                name: projectName,
                owner: database.user.id,
                shareWith: [
                    {
                        id: database.user.id,
                        username: database.user.username,
                        email: database.user.email,
                        avatarUrl: database.user.avatarUrl,
                    },
                ],
                shareWithIds: [database.user.id],
            });
            cy.callFirestore("set", `projects/${project.id}`, JSON.parse(JSON.stringify(project)));
            // logout();
            // login();
            cy.login("7mr64tVcVv3085oo0Y1VheOQYJXV");
        });
    });

    it("should change project type and next check projects counters", () => {
        cy.visit("/home", { timeout: 600000 });
        cy.get(`mat-expansion-panel:contains("Active projects")`, {
            timeout: 60000,
        }).should("contain", "3");
        cy.get(`mat-expansion-panel:contains("Someday/maybe projects")`, {
            timeout: 20000,
        }).should("contain", "0");
        clickOnEditProject(projectName);
        cy.get('mat-select[data-cy="select-project-type"]').click();
        cy.get("mat-option").contains(ProjectType.maybe).click();
        cy.get('[data-cy="save project"]').click();
        cy.get(`mat-expansion-panel:contains("Active projects")`, {
            timeout: 10000,
        }).should("contain", "2");
        cy.get(`mat-expansion-panel:contains("Someday/maybe projects")`, {
            timeout: 10000,
        }).should("contain", "1");
        clickOnProjectTypeLeftPanelMenu("Someday/maybe projects");
        cy.get("tickist-single-project").contains(projectName).should("exist");
    });

    it("should change project type using fast menu", () => {
        cy.visit("/", { timeout: 600000 });
        clickOnProjectTypeLeftPanelMenu("Active projects");
        cy.get(`tickist-single-project:contains(${projectName})`, {
            timeout: 20000,
        }).then(($project) => {
            cy.wrap($project.find("div#project")).trigger("mouseenter").get('[data-cy="project-fast-menu"]').click();
            cy.get("button").contains("Convert to Someday/maybe").click();
        });
        clickOnProjectTypeLeftPanelMenu("Someday/maybe projects");
        cy.get("tickist-single-project").contains(projectName).should("exist");
    });
});
