// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })


import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/firestore';
import attachCustomCommands from 'cypress-firebase/lib/attachCustomCommands'
// tslint:disable-next-line:nx-enforce-module-boundaries
import {environment as ci} from '@env/environment.ci'
// tslint:disable-next-line:nx-enforce-module-boundaries
import {environment as e2e} from '@env/environment.e2e'



let firebaseConfiguration;
if (Cypress.env('FIREBASE_PROJECT_ID') === 'tickist-testing') {
    firebaseConfiguration = e2e.firebase;
} else {
    firebaseConfiguration = ci.firebase;
}

console.log(JSON.stringify(firebaseConfiguration))

// firebaseConfiguration = environment.firebase;

const fbInstance = firebase.initializeApp(firebaseConfiguration);
if (fbInstance) {
    (window as any).fbInstance = fbInstance
}
attachCustomCommands({ Cypress, cy, firebase });
