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

import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/firestore";
import attachCustomCommands from "cypress-firebase/lib/attachCustomCommands";
// eslint-disable-next-line
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { environment as ci } from "@env/environment.ci";
// eslint-disable-next-line
import { environment as e2e } from "@env/environment.e2e";

let firebaseConfiguration;
let configuration;
if (Cypress.env("FIREBASE_PROJECT_ID") === "tickist-testing") {
    configuration = e2e;
    firebaseConfiguration = e2e.firebase;
} else {
    configuration = ci;
    firebaseConfiguration = ci.firebase;
}

console.log(JSON.stringify(configuration));

const fbInstance = firebase.initializeApp(firebaseConfiguration);
if (fbInstance) {
    (window as any).fbInstance = fbInstance;
}
if (firebaseConfiguration.emulator) {
    // firebase.firestore().settings({ experimentalForceLongPolling: true })
    firebase.firestore().settings({
        host: configuration.emulatorIPAddress,
        ssl: false,
        experimentalForceLongPolling: true,
    });
    firebase.auth().useEmulator("http://127.0.0.1:9099/");
}

// eslint-disable-next-line @typescript-eslint/naming-convention
attachCustomCommands({ Cypress, cy, firebase });
