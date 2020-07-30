import {IEnvironment} from './environment.interface';

export const environment: IEnvironment  = {
    name: 'e2e',
    production: false,
    e2eTest: true,
    emulator: true,
    experimentalForceLongPolling: true,
    emulatorIPAddress: '127.0.0.1:8080',
    // firebase: {
    //     apiKey: "AIzaSyCXjxhMO1-bqlG4y8OGGYO8wacRbR4gDCA",
    //     authDomain: "tickist-testing.firebaseapp.com",
    //     databaseURL: "https://tickist-testing.firebaseio.com",
    //     projectId: "tickist-testing",
    //     storageBucket: "tickist-testing.appspot.com",
    //     messagingSenderId: "241679590406",
    //     appId: "1:241679590406:web:82eedcef4f9583e7a64f87"
    // }
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
