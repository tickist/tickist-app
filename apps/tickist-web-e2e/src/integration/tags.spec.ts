import {clickOnTagsLeftPanelMenu, createFirebase, login, logout, removeOldFirebaseData} from '../support/utils';

describe("Tags", () => {
    before(() => {
        login();
        createFirebase()
    });

    after(() => {
        logout();
        removeOldFirebaseData();
    });

    describe("Create new tag", () => {
        beforeEach(() => {
            cy.visit('/home/tasks-tags-view');
        });

        it('should create new tag using a form in the left panel and delete it', () => {
           cy.url().should('include', 'tasks-tags-view');
            const newTagName = 'New tag name';
            const newTagName2 = 'New tag name2';
            cy.log("Create tag name");
            clickOnTagsLeftPanelMenu();
            cy.get('input[name=tag-name]').type(newTagName).should("have.value", newTagName);
            cy.get('[data-cy="createTag"]').click();
            cy.log("Edit tag name");
            cy.get(`tickist-tag:contains("${newTagName}")`).then($tag => {
                cy.wrap($tag.find('[data-cy="editTag"]')).click({force: true});
                cy.get('input[name=edit-tag-name]').clear().type(newTagName2).should("have.value", newTagName2);
                cy.get('[data-cy="changeTagName"]').click();
                cy.get(`tickist-tag:contains("${newTagName2}")`).should('exist');
            });
            cy.log("Delete tag");
            cy.get(`tickist-tag:contains("${newTagName2}")`).then($tag => {
                cy.wrap($tag.find('[data-cy="editTag"]')).click({force: true});
                cy.get('[data-cy="deleteTag"]').click();
            });
            cy.get(`tickist-tag:contains("${newTagName}")`).should('not.exist');
            cy.get(`tickist-tag:contains("${newTagName2}")`).should('not.exist');
        })
    })
});
