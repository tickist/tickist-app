import {Given} from "cypress-cucumber-preprocessor/steps";
import {Database} from "./create-database";


Given("Set firebase data", () => {
    cy.get('@uid').then((uid) => {
        return new Database(uid);
    });

});

Given("Remove old firebase data", () => {
    cy.callFirestore("delete", "projects", {
        recursive: true
    });
    cy.callFirestore("delete", "tasks", {
        recursive: true
    });
    cy.callFirestore("delete", "tags", {
        recursive: true
    });
});

Given("I go on page {string}",  (url) => {
    cy.visit(url)
});

Given("Login into Firebase", () => {
    cy.login().then($auth => cy.wrap($auth).its(<any> 'uid').as('uid'));
});
