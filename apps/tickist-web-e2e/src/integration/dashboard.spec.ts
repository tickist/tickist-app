import { createFirebase, login, removeOldFirebaseData } from "../support/utils";
import { addDays, format } from "date-fns";

describe("Dashboard view", () => {
    beforeEach(() => {
        cy.login("7mr64tVcVv3085oo0Y1VheOQYJXV");
        createFirebase();
        cy.visit("/");
    });

    afterEach(() => {
        removeOldFirebaseData();
    });

    it("should see weekdays view", () => {
        cy.visit("/home/weekdays", { timeout: 600000 });
        cy.url().should("include", "home").should("include", "weekdays");
        cy.get("tickist-today", { timeout: 60000 })
            .find('tickist-single-task:contains("Task 1")')
            .should(($task) => {
                expect($task).to.have.length(1);
                expect($task.first()).to.contain("Task 1");
                expect($task.first()).to.contain(format(new Date(), "dd-MM-yyyy"));
            });

        cy.get("tickist-overdue", { timeout: 10000 })
            .find("tickist-single-task")
            .should(($task) => {
                expect($task).to.have.length(1);
                expect($task.first()).to.contain("Task 2");
                expect($task.first()).to.contain(format(addDays(new Date(), -1), "dd-MM-yyyy"));
            });
    });
    describe("Change view button", () => {
        it("should change tasks view", () => {
            cy.visit("/home/weekdays", { timeout: 600000 });
            cy.get("tickist-today", { timeout: 600000 })
                .find("tickist-single-task-simplified")
                .should(($task) => {
                    expect($task).to.have.length(0);
                });

            cy.get("tickist-overdue")
                .find("tickist-single-task-simplified")
                .should(($task) => {
                    expect($task).to.have.length(0);
                });

            cy.get("tickist-today").find("tickist-change-task-view").click();
            cy.get("tickist-overdue").find("tickist-change-task-view").click();

            cy.get("tickist-today")
                .find('tickist-single-task-simplified:contains("Task 1")')
                .should(($task) => {
                    expect($task).to.have.length(1);
                    expect($task.first()).to.contain("Task 1");
                    expect($task.first()).to.contain(format(new Date(), "dd-MM-yyyy"));
                });

            cy.get("tickist-overdue")
                .find("tickist-single-task-simplified")
                .should(($task) => {
                    expect($task).to.have.length(1);
                    expect($task.first()).to.contain("Task 2");
                    expect($task.first()).to.contain(format(addDays(new Date(), -1), "dd-MM-yyyy"));
                });
        });
    });
});
