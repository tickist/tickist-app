import { getGreeting } from '../support/app.po';

describe('tickist-web-web', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    getGreeting().contains('Welcome to tickist-web!');
  });
});
