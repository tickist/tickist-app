import {IEnvironment} from './environment.interface';
import {NgxLoggerLevel} from "ngx-logger";

export const environment: IEnvironment = {
    production: false,
    name: 'dev',
    e2eTest: false,
    emulator: true,
    emulatorIPAddress: 'localhost:8080',
    experimentalForceLongPolling: false,
    logger: {
        level: NgxLoggerLevel.DEBUG,
        serverLogLevel: NgxLoggerLevel.OFF
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
