// import {createFirebase} from '../support/steps';

describe('Dashboard view', () => {
    beforeEach(() => {
        cy.login()
        //createFirebase();

    });

    it('should see dashboard view', () => {
        cy.visit('/')
    })
});
