import {
    clickMenuElement,
    clickOnProject,
    clickOnWeekDay,
    compareTaskElementWithTaskObject,
    createFirebase,
    createTask,
    login
} from '../support/utils';
import {format} from 'date-fns';
import {ITaskApi, Task} from '@data/tasks/models/tasks';
import {TaskProject} from '@data/tasks/models/task-project';


describe('Tasks', () => {
    before(() => {
        login();
        createFirebase();

    });

    beforeEach(() => {
        cy.visit('/');
    });

    describe('Click on add new task button', () => {
        let task: any;
        beforeEach(() => {
            task = {
                name: 'Task 3',
                priority: 'A',
                description: 'Task description',
                tags: [],
                finishDate: new Date(),
                finishTime: '10:00',
                taskProject: <Partial<TaskProject>> {name: 'Inbox'},
                steps: [{name: 'step 1'}, {name: 'step 2'}]
            }
        });

        it('should open the form, fills the form add new task to the Inbox', () => {
            cy.get('tickist-add-task').find('button').click();
            cy.url().should('include', 'home').should('include', 'edit-task');

            cy.log('fill main form');
            cy.get('input[name=taskName]').type('Task 3');
            cy.get('tickist-priority').find('button').contains('A').click();

            cy.get('input[name=finishDate]').focus();
            cy.get('mat-calendar').find('.mat-calendar-body-today').click();
            // cy.get('body').type('{esc}');
            cy.get('input[name=finishTime]').type('10:00');

            cy.log('fill repeat form');
            clickMenuElement('Repeat');
            cy.get('mat-radio-group').contains('monthly').click();

            cy.log('fill steps');
            clickMenuElement('Steps');
            cy.get('#steps').find('input').last().type("step 1");
            cy.get("#add-step").contains('Add new step').click();
            cy.get('#steps').find('input').last().type("step 2");
            // extra
            clickMenuElement('Extra');

            cy.get('textarea').type("Task description");

            cy.get("button[type='submit']").click();

            cy.url().should('include', 'home').should('include', 'dashboard');
            clickOnProject('Inbox');

            cy.get('tickist-single-task:contains("Task 3")').then($task => {
                compareTaskElementWithTaskObject($task, task)
            })

        });
    });

    describe('Change task status', () => {
        it("should change task status to done after click on tickist-toggle-button", () => {
            const newTaskName = "new task";
            cy.log("Create new task");
            cy.get('tickist-add-task').find('button').click();
            cy.url().should('include', 'home').should('include', 'edit-task');
            cy.log('fill main form');
            cy.get('input[name=taskName]').type(newTaskName);
            cy.get("button[type='submit']").click();

            clickOnProject("Inbox");

            cy.get(`tickist-single-task:contains("${newTaskName}")`).then($task => {
                $task.find('tickist-toggle-button').on('click', () => {});
            });
            cy.get(`tickist-single-task:contains("${newTaskName}")`).should('not.exist');
            cy.get('simple-snack-bar').contains("Task is done. Great job!").should('exist')


        });

        it('should change finish date when task has enabled repeat options', () => {

        });
    });

    describe('Pin task', () => {
        it("should pinned task after click on pin icon next unpinned task after again click on pin icon", () => {
            cy.get('tickist-single-task:contains("Task 4")').should('not.be.visible');
            clickOnProject('Project 2');
            cy.get('tickist-single-task:contains("Task 4")').then($task => {
                cy.wrap($task.find('#first-row')).trigger('mouseenter').get('tickist-pin-button').click();
            });
            clickOnWeekDay('today');
            cy.get('tickist-single-task:contains("Task 4")').then($task => {
                // tslint:disable-next-line:no-unused-expression
                expect($task.find('tickist-pin-button')).to.be.visible;
                cy.wrap($task.find('#first-row')).trigger('mouseenter').get('tickist-pin-button').click();
            });
            cy.get('tickist-single-task:contains("Task 4")').should('not.be.visible')
        });
    });

    describe('Change task assigned to', () => {

    });

    describe("Delete task", () => {
        const deletedTask = 'Deleted task';
        const nonDeletedTask = "Task 1";

        it('should delete task after click on button "delete task" and "Yes"', () => {
            createTask(deletedTask);
            clickOnProject('All projects');
            cy.get(`tickist-single-task:contains("${deletedTask}")`).then($task => {
                cy.wrap($task.find('#first-row')).trigger('mouseenter').get('[data-cy="task-short-menu"]').click();
                cy.get('[data-cy="delete-task-button"]').click();
            });
            cy.get('tickist-delete-task').within(()=> {
                cy.get('button').contains("Yes").click()
            });
            cy.get('simple-snack-bar').contains("Task has been deleted successfully").should('exist');
            cy.get(`tickist-single-task:contains("${deletedTask}")`).should('not.exist');
        });

        it('should not delete task after click on button "delete task" and "No"', () => {
            clickOnProject('All projects');
            cy.get(`tickist-single-task:contains("${nonDeletedTask}")`).then($task => {
                cy.wrap($task.find('#first-row')).trigger('mouseenter').get('[data-cy="task-short-menu"]').click();
                cy.get('[data-cy="delete-task-button"]').click();
            });
            cy.get('tickist-delete-task').within(()=> {
                cy.get('button').contains("No").click()
            });
            cy.get(`tickist-single-task:contains("${nonDeletedTask}")`).should('exist');
        });
    });


});