import {clickOnCreateNewProject, clickOnProject, createFirebase, login} from '../support/utils';

describe("Projects", () => {
    before(() => {
        login();
        // createFirebase()
    });

    beforeEach(() => {
        cy.visit('/');
    });

    describe("Add new projects", () => {
        const newProjectName = "New project";
        const newProjectDescription = "New project description";
        it.only("should add new project", () => {
            cy.log("Start creating a new project");
            clickOnCreateNewProject();
            cy.get('input[name=projectName]').type(newProjectName);
            cy.get('textarea[name=projectDescription]').type(newProjectDescription);
            cy.get('.\\#6be494 > .ng-fa-icon > .svg-inline--fa').click();
            cy.get('[data-cy="save project"]').click();
            clickOnProject(newProjectName);
            cy.url().should('include', 'tasks-projects-view');
            cy.get('tickist-tasks-from-projects').should('contain', newProjectName);
            cy.get('tickist-tasks-from-projects').should('contain', newProjectDescription);
            cy.get('tickist-tasks-from-projects').should('contain', 'Tasks list is empty');

        })
    })
});
