// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
// import './commands';

Cypress.on("window:before:load", win => {
    win.indexedDB.deleteDatabase("localstorage");
});


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
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

// import firebase from 'firebase/app';
// import 'firebase/auth';
// import 'firebase/database';
// import 'firebase/firestore';
// import * as admin from 'firebase-admin';
// import { attachCustomCommands } from 'cypress-firebase';
//
// const fbConfig = {
//     apiKey: 'AIzaSyDu-vOMokFGi5I3oV5tLN5PIqctHyCNcNg',
//     authDomain: 'proven-reality-657.firebaseapp.com',
//     databaseURL: 'https://proven-reality-657.firebaseio.com',
//     projectId: 'proven-reality-657',
//     storageBucket: 'proven-reality-657.appspot.com',
//     messagingSenderId: '924613962771',
//     appId: '1:924613962771:web:52fe355b5723d6af'
// };
// admin.initializeApp({
//     credential: admin.credential.applicationDefault(),
//     databaseURL: 'https://proven-reality-657.firebaseio.com'
// });

//
// firebase.initializeApp(fbConfig);
Cypress.Commands.add('checkLogin', () => {
    console.log('admin');
});
// attachCustomCommands({ Cypress, cy, firebase });

