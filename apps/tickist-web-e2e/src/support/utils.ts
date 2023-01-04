import { Database } from "./create-database";
import { format } from "date-fns";

export function createFirebase() {
    removeOldFirebaseData();
    setFirebaseData();
}

export const userID = "7mr64tVcVv3085oo0Y1VheOQYJXV";

export function login() {
    cy.visit("/", { timeout: 100000 });
    cy.get("input[name=email]").type("test@tickist.com");
    cy.get("input[name=password]").type("passpass");
    cy.get("button[type='submit']").click();
}

export function logout() {
    cy.visit("/");
    cy.get("tickist-user-avatar").click();
    cy.get('[data-cy="logout"]').click();
    cy.visit("/");
}

function setFirebaseData() {
    const database = new Database(userID);
    cy.wrap(database).as("database");
    cy.callFirestore("set", `projects/${database.inbox.id}`, JSON.parse(JSON.stringify(database.inbox)));
    cy.callFirestore("set", `projects/${database.inbox.id}` + 1, JSON.parse(JSON.stringify(database.inbox)));
    cy.log("test");
    cy.log(database.projects.length);
    database.projects.forEach((project) => {
        console.log({ project });
        cy.callFirestore("set", `projects/${project.id}`, JSON.parse(JSON.stringify(project)));
    });
    database.tasks.forEach((task) => {
        cy.callFirestore("set", `tasks/${task.id}`, JSON.parse(JSON.stringify(task)));
    });
}

export function removeOldFirebaseData() {
    cy.callFirestore("delete", "projects", {
        recursive: true,
    });
    cy.callFirestore("delete", "tasks", {
        recursive: true,
    });
    cy.callFirestore("delete", "tags", {
        recursive: true,
    });

    cy.callFirestore("delete", "notifications", {
        recursive: true,
    });
}

export function clickMenuElement(element: string) {
    cy.get("mat-list").contains(element).click({ force: true });
}

export function clickOnProject(projectName: string, projectType = "Active projects") {
    cy.get("mat-sidenav", { timeout: 60000 }).find("mat-panel-title").contains(projectType).click();
    if (projectName === "Inbox") {
        cy.get("mat-sidenav").find("mat-panel-title").contains(projectName).click();
    } else if (projectName !== "All projects") {
        // @TODO remove force
        cy.get("tickist-single-project")
            .contains(projectName)
            .click({ force: true })
            .then(() => {
                cy.get("tickist-single-project").find("div.isActive").should("exist");
            });
    } else {
        cy.get(`[dataCy="${projectType}"]`).click();
    }
}

export function clickOnTagsLeftPanelMenu() {
    cy.get("mat-sidenav", { timeout: 600000 }).find("mat-panel-title").contains("Tags").click();
}

export function clickOnProjectTypeLeftPanelMenu(projectType) {
    cy.get("mat-sidenav", { timeout: 600000 }).find("mat-panel-title").contains(projectType).click();
}

export function clickOnEditProject(projectName: string, projectType = "Active projects") {
    cy.get("mat-sidenav").find("mat-panel-title").contains(projectType).click();
    cy.get("tickist-single-project")
        .contains(projectName)
        .click({ force: true })
        .then(() => {
            cy.get("tickist-single-project").find("div.isActive").should("exist");
        });
    cy.get('[data-cy="edit-project"]').click();
}

export function clickOnCreateNewProject() {
    const projectType = "Active projects";
    cy.get("mat-sidenav").find("mat-panel-title").contains("Active projects").click();
    // @TODO remove force
    cy.get(`mat-expansion-panel:contains("${projectType}")`, {
        timeout: 10000,
    }).then((matPanel$) => {
        cy.wrap(matPanel$.find('[data-cy="create-new-project"]')).click({
            force: true,
        });
    });
}

export function createTask(taskName) {
    cy.log("Create new task");
    cy.get("tickist-add-task-footer-button").find("button").click();
    cy.url().should("include", "home").should("include", "edit-task");
    cy.log("fill main form");
    cy.get("input[name=taskName]").type(taskName);
    cy.get("button[type='submit']").click();
}

export function clickOnWeekDay(weekday: string) {
    cy.get("mat-sidenav")
        .find("mat-panel-title")
        .contains("Weekdays")
        .then(($elem) => {
            cy.wrap($elem).click({ force: true });
        });
    cy.get("mat-list-item").contains(weekday).click();
}

export function compareTaskElementWithTaskObject($taskElement, taskObject) {
    expect($taskElement.find("tickist-task-name")).to.contain(taskObject.name);
    if (taskObject.finishDate) {
        expect($taskElement).to.contain(format(taskObject.finishDate, "dd-MM-yyyy"));
    }
    if (taskObject.finishTime) {
        expect($taskElement).to.contain(taskObject.finishTime);
    }
    // project
    $taskElement.find("#taskProjectNameIcon").click();
    expect($taskElement.find("mat-select")).to.contain(taskObject.taskProject.name);
    $taskElement.find(".close-menu-icon").click();
    // task description
    $taskElement.find("#taskDescriptionIcon").click();
    expect($taskElement.find(".task-description")).to.contain(taskObject.description);
    $taskElement.find(".close-menu-icon").click();
    // steps
    if (taskObject.steps.length) {
        $taskElement.find("#taskSteps").click();
        expect($taskElement.find(".step")).to.length(taskObject.steps.length);
        Array.from($taskElement.find(".step")).forEach((step$, index) => {
            expect(step$).to.contain(taskObject.steps[index].name);
        });
        $taskElement.find(".close-menu-icon").click();
    } else {
        expect($taskElement.find(".step")).to.length(taskObject.steps.length);
    }
}
