import {login} from '../support/utils';

describe("Tags", () => {
    before(() => {
        login();
        // createFirebase()
    });

    beforeEach(() => {
        cy.visit('/home/(content:tasks-tags-view//left:left-panel)');
    });
});
