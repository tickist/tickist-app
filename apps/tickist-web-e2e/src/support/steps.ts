import {Database} from "./create-database";

export function createFirebase() {
    removeOldFirebaseData();
    setFirebaseData()
}

export function login() {
    cy.login().then($auth => cy.wrap($auth).its(<any> 'uid').as('uid'));
}

function setFirebaseData() {
    cy.get('@uid').then((uid) => {
        return new Database(uid);
    });
}

function removeOldFirebaseData() {
    cy.callFirestore("delete", "projects", {
        recursive: true
    });
    cy.callFirestore("delete", "tasks", {
        recursive: true
    });
    cy.callFirestore("delete", "tags", {
        recursive: true
    });
}

