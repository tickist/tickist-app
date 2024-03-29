import { clickOnTagsLeftPanelMenu, createFirebase, removeOldFirebaseData } from "../support/utils";

describe("Tags", () => {
    beforeEach(() => {
        cy.login("7mr64tVcVv3085oo0Y1VheOQYJXV");
        createFirebase();
        cy.visit("/");
    });

    afterEach(() => {
        removeOldFirebaseData();
    });

    describe("Create new tag", () => {
        beforeEach(() => {
            clickOnTagsLeftPanelMenu();
        });

        it("should create new tag using a form in the left panel and delete it", () => {
            cy.url().should("include", "tasks-tags-view");
            const newTagName = "New tag name";
            const newTagName2 = "New tag name2";
            cy.get("tickist-user-avatar", { timeout: 40000 }).should("be.visible");
            cy.log("Create tag name");
            cy.get("input[name=tag-name]").type(newTagName);
            cy.get("input[name=tag-name]").should("have.value", newTagName);
            cy.get('[data-cy="createTag"]').click();
            cy.log("Edit tag name");
            cy.get(`tickist-tag:contains("${newTagName}")`, { timeout: 20000 }).then(($tag) => {
                cy.wrap($tag.find('[data-cy="editTag"]')).click({
                    force: true,
                });
                cy.get("input[name=edit-tag-name]").clear();
                cy.get("input[name=edit-tag-name]").type(newTagName2);
                cy.get("input[name=edit-tag-name]").should("have.value", newTagName2);
                cy.get('[data-cy="changeTagName"]').click();
                cy.get(`tickist-tag:contains("${newTagName2}")`).should("exist");
            });
            cy.log("Delete tag");
            cy.get(`tickist-tag:contains("${newTagName2}")`).then(($tag) => {
                cy.wrap($tag.find('[data-cy="editTag"]')).click({
                    force: true,
                });
                cy.get('[data-cy="deleteTag"]').click();
            });
            cy.get(`tickist-tag:contains("${newTagName}")`).should("not.exist");
            cy.get(`tickist-tag:contains("${newTagName2}")`).should("not.exist");
        });
    });
});
