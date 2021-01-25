import {IEnvironment} from './environment.interface';
import {NgxLoggerLevel} from "ngx-logger";

export const environment: IEnvironment  = {
    name: 'e2e',
    production: false,
    e2eTest: true,
    emulator: true,
    authEmulator: true,
    experimentalForceLongPolling: true,
    emulatorIPAddress: '127.0.0.1:8080',
    logger: {
        level: NgxLoggerLevel.DEBUG
    },
    firebase: {
        apiKey: 'AIzaSyDu-vOMokFGi5I3oV5tLN5PIqctHyCNcNg',
        authDomain: 'proven-reality-657.firebaseapp.com',
        databaseURL: 'https://proven-reality-657.firebaseio.com',
        projectId: 'proven-reality-657',
        storageBucket: 'proven-reality-657.appspot.com',
        messagingSenderId: '924613962771',
        appId: '1:924613962771:web:52fe355b5723d6af'
    }
};
