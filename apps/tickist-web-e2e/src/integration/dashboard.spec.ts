import {createFirebase, login} from '../support/utils';
import {addDays, format} from 'date-fns';

describe('Dashboard view', () => {
    before(() => {
        login();
        createFirebase();
    });

    beforeEach(() => {
        cy.visit('/');
    });

    it('should see dashboard view', () => {

        cy.url().should('include', 'home').should('include', 'dashboard');
        cy.get('tickist-today').find('tickist-single-task').should(($task) => {
            expect($task).to.have.length(1);
            expect($task.first()).to.contain('Task 1');
            expect($task.first()).to.contain(format(new Date(), 'dd-MM-yyyy'));
        });

        cy.get('tickist-overdue').find('tickist-single-task').should(($task) => {
            expect($task).to.have.length(1);
            expect($task.first()).to.contain('Task 2');
            expect($task.first()).to.contain(format(addDays(new Date(), -1), 'dd-MM-yyyy'));
        });
    });
    describe('Change view button', () => {
        it('should change tasks view', () => {
            cy.get('tickist-today').find('tickist-single-task-simplified').should(($task) => {
                expect($task).to.have.length(0);
            });

            cy.get('tickist-overdue').find('tickist-single-task-simplified').should(($task) => {
                expect($task).to.have.length(0);
            });

            cy.get('tickist-today').find('change-task-view').click();
            cy.get('tickist-overdue').find('change-task-view').click();

            cy.get('tickist-today').find('tickist-single-task-simplified').should(($task) => {
                expect($task).to.have.length(1);
                expect($task.first()).to.contain('Task 1');
                expect($task.first()).to.contain(format(new Date(), 'dd-MM-yyyy'));
            });

            cy.get('tickist-overdue').find('tickist-single-task-simplified').should(($task) => {
                expect($task).to.have.length(1);
                expect($task.first()).to.contain('Task 2');
                expect($task.first()).to.contain(format(addDays(new Date(), -1), 'dd-MM-yyyy'));
            });
        });
    });


});
