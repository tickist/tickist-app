import {Database} from './create-database';
import {format} from 'date-fns';

export function createFirebase() {
    removeOldFirebaseData();
    setFirebaseData();
}

export function login() {
    cy.login().then($auth => cy.wrap($auth).its(<any>'uid').as('uid'));
}

export function logout() {
    cy.logout();
}

function setFirebaseData() {
    cy.get('@uid').then((uid) => {
        const database = new Database(uid);
        cy.callFirestore('set', `users/${database.uid}`, {...database.user});

        // cy.callFirestore('set', `projects/${database.inbox.id}`, JSON.parse(JSON.stringify(database.inbox)));
        database.projects.forEach(project => {
            cy.callFirestore('set', `projects/${project.id}`, JSON.parse(JSON.stringify(project)));
        });
        database.tags.forEach(tag => {
            cy.callFirestore('set', `tags/${tag.id}`, JSON.parse(JSON.stringify(tag)));
        });
        database.tasks.forEach(task => {
            cy.callFirestore('set', `tasks/${task.id}`, JSON.parse(JSON.stringify(task)));
        });
    });
}

export function removeOldFirebaseData() {
    cy.callFirestore('delete', 'projects', {
        recursive: true
    });
    cy.callFirestore('delete', 'tasks', {
        recursive: true
    });
    cy.callFirestore('delete', 'tags', {
        recursive: true
    });

    cy.callFirestore('delete', 'users', {
        recursive: true
    });
}

export function clickMenuElement(element: string) {
    cy.get('mat-list').contains(element).click();
}

export function clickOnProject(projectName: string) {
    cy.get('mat-sidenav').find('mat-panel-title').contains('Projects').click();
    if (projectName !== "All projects") {
        // @TODO remove force
        cy.get('tickist-single-project').contains(projectName).click({force: true}).then(() => {
            cy.get('tickist-single-project').find('div.isActive').should('exist')
        });
    } else {
        cy.get('[data-cy="All projects"]').click()
    }
}

export function clickOnTagsLeftPanelMenu() {
    cy.get('mat-sidenav').find('mat-panel-title').contains('Tags').click();
}

export function clickOnEditProject(projectName: string) {
    cy.get('mat-sidenav').find('mat-panel-title').contains('Projects').click();
    cy.get('tickist-single-project').contains(projectName).click({force: true}).then(() => {
        cy.get('tickist-single-project').find('div.isActive').should('exist')
    });
    cy.get('[data-cy="edit-project"]').click()
}

export function clickOnCreateNewProject() {
    cy.get('mat-sidenav').find('mat-panel-title').contains('Projects').click({force: true});
    // @TODO remove force
    cy.get('[data-cy="create-new-project"]').click({force: true});
}


export function createTask(taskName) {
    cy.log("Create new task");
    cy.get('tickist-add-task').find('button').click();
    cy.url().should('include', 'home').should('include', 'edit-task');
    cy.log('fill main form');
    cy.get('input[name=taskName]').type(taskName);
    cy.get("button[type='submit']").click();
}

export function clickOnWeekDay(weekday: string) {
    cy.get('mat-sidenav').find('mat-panel-title').contains('Weekdays').click();
    cy.get('mat-list-item').contains(weekday).click();
}

export function compareTaskElementWithTaskObject($taskElement, taskObject) {
    expect($taskElement.find('tickist-task-name')).to.contain(taskObject.name);
    if (taskObject.finishDate) expect($taskElement).to.contain(format(taskObject.finishDate, 'dd-MM-yyyy'));
    if (taskObject.finishTime) expect($taskElement).to.contain(taskObject.finishTime);
    // project
    $taskElement.find('#taskProjectNameIcon').click();
    expect($taskElement.find('mat-select')).to.contain(taskObject.taskProject.name);
    $taskElement.find('.close-menu-icon').click();
    // task description
    $taskElement.find('#taskDescriptionIcon').click();
    expect($taskElement.find('.task-description')).to.contain(taskObject.description);
    $taskElement.find('.close-menu-icon').click();
    // steps
    if (taskObject.steps.length) {
        $taskElement.find("#taskSteps").click();
        expect($taskElement.find('.step')).to.length(taskObject.steps.length);
        Array.from($taskElement.find('.step')).forEach((step$, index) => {
            expect(step$).to.contain(taskObject.steps[index].name)
        });
        $taskElement.find('.close-menu-icon').click();
    } else {
        expect($taskElement.find('.step')).to.length(taskObject.steps.length);
    }
}
