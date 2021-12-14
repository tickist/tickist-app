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

import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import "firebase/compat/firestore";
import { attachCustomCommands } from "cypress-firebase";
// eslint-disable-next-line
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { environment as ci } from "@env/environment.ci";
// eslint-disable-next-line
import { environment as e2e } from "@env/environment.e2e";
import { createFirebase, login } from "./utils";

const firebaseConfiguration = {};
// let configuration;
// if (Cypress.env("FIREBASE_PROJECT_ID") === "tickist-testing") {
//     configuration = e2e;
//     firebaseConfiguration = e2e.firebase;
// } else {
//     configuration = ci;
//     firebaseConfiguration = ci.firebase;
// }

const configuration = {
    emulator: true,
    firebase: {
        apiKey: "AIzaSyDu-vOMokFGi5I3oV5tLN5PIqctHyCNcNg",
        authDomain: "proven-reality-657.firebaseapp.com",
        databaseURL: "https://proven-reality-657.firebaseio.com",
        projectId: "proven-reality-657",
        storageBucket: "proven-reality-657.appspot.com",
        messagingSenderId: "924613962771",
        appId: "1:924613962771:web:52fe355b5723d6af",
    },
};

console.log(JSON.stringify(configuration));

const fbInstance = firebase.initializeApp(configuration.firebase);
if (fbInstance) {
    (window as any).fbInstance = fbInstance;
}
if (configuration.emulator) {
    // firebase.firestore().settings({ experimentalForceLongPolling: true })
    console.log({ firebase });
    firebase.firestore().settings({
        // host: configuration.emulatorIPAddress,
        host: "localhost:8080",
        ssl: false,
        experimentalForceLongPolling: true,
    });
    firebase.auth().useEmulator("http://localhost:9099/");
}

// eslint-disable-next-line @typescript-eslint/naming-convention
attachCustomCommands({ Cypress, cy, firebase });
