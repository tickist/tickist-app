import { removeOldFirebaseData } from "../support/utils";

describe("Create and delete user", () => {
    const username = "test";
    const userEmail = "test_delete8@tickist.com";
    const userPassword = "passpass";

    beforeEach(() => {
        removeOldFirebaseData();
        cy.logout();
        cy.visit("/");
    });

    it("should create and next delete user using form from user settings", () => {
        cy.visit("/signup");
        cy.get("input[name=username]").type(username);
        cy.get("input[name=email]").type(userEmail);
        cy.get("input[name=password]").type(userPassword);
        cy.get("button[type='submit']").click();
        cy.get('[data-cy="user-menu"]').click();
        cy.get('[data-cy="user-settings"]').click();
        cy.get('[data-cy="delete-user-account"]').click();
        cy.get('[data-cy="delete-user-account-confirmation"]').click();
        cy.get("input[name=password]").type(userPassword);
        cy.get('[data-cy="delete-user-account-confirmation"]').click();
        cy.log("Login attempt");
        cy.get("input[name=email]", { timeout: 600000 }).type(userEmail);
        cy.get("input[name=password]").type(userPassword);
        cy.get("button[type='submit']").click();
        cy.get("mat-error", { timeout: 600000 }).should("contain", "Firebase: Error (auth/user-not-found).");
    });
});
