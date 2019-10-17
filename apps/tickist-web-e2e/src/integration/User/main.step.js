import {Given, When, Then} from 'cypress-cucumber-preprocessor/steps'




When("I fill registration form", () => {
    cy.get('input[name=username]').type('user');
    cy.get('input[name=email]').type('user@tickist.com');
    cy.get('input[name=password]').type('passpass1');
});

When("I click on {string} button", (button) => {
    cy.get(`button:contains("${button}")`).click()
});


Then("I am logged in", () => {
    cy.url().should('include', 'home')
});
