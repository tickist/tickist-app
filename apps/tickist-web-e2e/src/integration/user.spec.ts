import {login} from "../support/utils";

describe('Create and delete user', () => {
    const username = 'test'
    const userEmail = 'test_delete2@tickist.com'
    const userPassword = "passpass"

    it('should create and next delete user using form from user settings', () => {
        cy.visit('/signup')
        cy.get('input[name=username]').type(username);
        cy.get('input[name=email]').type(userEmail);
        cy.get('input[name=password]').type(userPassword);
        cy.get('button[type=\'submit\']').click();
        cy.get('[data-cy="user-menu"]').click();
        cy.get('[data-cy="user-settings"]').click();
        cy.get('[data-cy="delete-user-account"]').click();
        cy.get('[data-cy="delete-user-account-confirmation"]').click();
        cy.get('input[name=password]').type(userPassword);
        cy.get('[data-cy="delete-user-account-confirmation"]').click();
        cy.log('Login attempt')
        cy.get('input[name=email]').type(userEmail);
        cy.get('input[name=password]').type(userPassword);
        cy.get('button[type=\'submit\']').click();
        cy.get('mat-error').should('contain', 'There is no user record corresponding to this identifier. The user may have been deleted.');
    })
})
