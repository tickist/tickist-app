import {
    clickOnCreateNewProject,
    clickOnEditProject,
    clickOnProject, clickOnProjectTypeLeftPanelMenu,
    createFirebase,
    login,
    logout,
    removeOldFirebaseData
} from '../../support/utils';
import {Project, ProjectType, Task} from "@data";
import {createUniqueId} from "@tickist/utils";

describe('Edit Projects', () => {
    before(() => {
        cy.wait(100000);
    });

    beforeEach(() => {
        login();
        createFirebase();
        cy.visit('/');
    });

    afterEach(() => {
        logout();
        removeOldFirebaseData();
    });


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


    describe('Change project type', () => {
        let projectName;
        beforeEach(() => {
            cy.get('@database').then((database: any) => {
                projectName = 'Project with projectType Alive';
                const project = new Project({
                    id: createUniqueId(),
                    name: projectName,
                    owner: database.user.id,
                    shareWith: [{
                        id: database.user.id,
                        username: database.user.username,
                        email: database.user.email,
                        avatarUrl: database.user.avatarUrl
                    }],
                    shareWithIds: [database.user.id]

                });
                cy.callFirestore('set', `projects/${project.id}`, JSON.parse(JSON.stringify(project)));
            });
        })

        it('should change project type and next check projects counters', () => {
            cy.get(`mat-expansion-panel:contains("Alive projects")`, {timeout: 10000}).should('contain', '3')
            cy.get(`mat-expansion-panel:contains("Someday/maybe projects")`, {timeout: 10000}).should('contain', '0')
            clickOnEditProject(projectName);
            cy.get('mat-select[data-cy="select-project-type"]').click();
            cy.get('mat-option').contains(ProjectType.MAYBE).click();
            cy.get('[data-cy="save project"]').click();
            cy.get(`mat-expansion-panel:contains("Alive projects")`, {timeout: 10000}).should('contain', '2')
            cy.get(`mat-expansion-panel:contains("Someday/maybe projects")`, {timeout: 10000}).should('contain', '1')
            clickOnProjectTypeLeftPanelMenu('Someday/maybe projects')
            cy.get('tickist-single-project').contains(projectName).should('exist')
        })

        it('should change project type using fast menu', () => {
            clickOnProjectTypeLeftPanelMenu('Alive projects')
            cy.get(`tickist-single-project:contains(${projectName})`, {timeout: 10000}).then($project => {
                cy.wrap($project.find('div#project')).trigger('mouseenter').get('[data-cy="project-fast-menu"]').click();
                cy.get('button').contains('Convert to Someday/maybe').click();
            });
            clickOnProjectTypeLeftPanelMenu('Someday/maybe projects')
            cy.get('tickist-single-project').contains(projectName).should('exist')
        })
    })

});
