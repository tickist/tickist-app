import {IEnvironment} from './environment.interface';
import {NgxLoggerLevel} from "ngx-logger";

export const environment: IEnvironment = {
    name: 'CI',
    production: true,
    e2eTest: true,
    emulator: true,
    authEmulator: true,
    emulatorIPAddress: '127.0.0.1:8080',
    experimentalForceLongPolling: true,
    logger: {
        level: NgxLoggerLevel.DEBUG
    },
    firebase: {
        apiKey: "AIzaSyDwy1Vcqodkt8lqdRNy8hh8wqrB1kX7sCU",
        authDomain: "tickist-ci.firebaseapp.com",
        databaseURL: "https://tickist-ci.firebaseio.com",
        projectId: "tickist-ci",
        storageBucket: "tickist-ci.appspot.com",
        messagingSenderId: "714177725631",
        appId: "1:714177725631:web:1e74160d0a525af47c320a"
    }
};
