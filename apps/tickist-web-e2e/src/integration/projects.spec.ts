import {
    clickOnCreateNewProject,
    clickOnEditProject,
    clickOnProject,
    createFirebase,
    login,
    logout,
    removeOldFirebaseData
} from '../support/utils';

describe('Projects', () => {
    before(() => {
        login();
        createFirebase()
    });

    after(() => {
        logout();
        removeOldFirebaseData();
    });

    beforeEach(() => {
        cy.visit('/');
    });

    describe('Add new projects', () => {
        const newProjectName = 'New project';
        const newProjectDescription = 'New project description';

        it('should add new project', () => {
            cy.log('Start creating a new project');
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

        });

        it("should add new project with ancestor", () => {
            const ancestorName = 'Project 1';
            cy.log('Start creating a new project with ancestor');
            clickOnCreateNewProject();
            cy.get('input[name=projectName]').type(newProjectName);
            cy.get('mat-select[data-cy="select-ancestor"]').click();
            cy.get('mat-option').contains(ancestorName).click();

            cy.get('[data-cy="save project"]').click();
            cy.get(`tickist-single-project:contains(${ancestorName})`).then($project => {
                expect($project.next()).to.contain.text(newProjectName);
                expect($project.next()).to.contain.text('0');
            })
        })
    });

    describe("Edit project", () => {
        it('should change project name', () => {
            const newProjectName = 'Project new 1';
            const oldProjectName = 'Project 1';
            cy.get(`tickist-single-project:contains(${newProjectName})`).should('not.exist');

            clickOnEditProject(oldProjectName);
            cy.get('input[name=projectName]').clear();
            cy.get('input[name=projectName]').type(newProjectName);
            cy.get('[data-cy="save project"]').click();
            cy.get(`tickist-single-project:contains(${newProjectName})`).should('exist');
            cy.get('tickist-tasks-from-projects').contains(newProjectName).should('exist');

            clickOnEditProject(newProjectName);
            cy.get('input[name=projectName]').clear();
            cy.get('input[name=projectName]').type(oldProjectName);
            cy.get('[data-cy="save project"]').click();
            cy.get(`tickist-single-project:contains(${oldProjectName})`).should('exist');
            cy.get('tickist-tasks-from-projects').contains(oldProjectName).should('exist');

        });
    })

});
