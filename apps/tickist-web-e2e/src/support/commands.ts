import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import "firebase/compat/firestore";
import { attachCustomCommands } from "cypress-firebase";

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
    emulatorIPAddress: "localhost:8080",
    emulatorAuthAddress: "http://localhost:9099/",
};

const fbInstance = firebase.initializeApp(configuration.firebase);
if (fbInstance) {
    (window as any).fbInstance = fbInstance;
}
if (configuration.emulator) {
    firebase.firestore().settings({
        host: configuration.emulatorIPAddress,
        ssl: false,
        experimentalForceLongPolling: true,
    });
    firebase.auth().useEmulator(configuration.emulatorAuthAddress);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
attachCustomCommands({ Cypress, cy, firebase });
