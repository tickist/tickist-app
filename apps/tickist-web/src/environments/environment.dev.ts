import {IEnvironment} from './environment.interface';

export const environment: IEnvironment = {
    production: false,
    e2eTest: false,
    emulator: true,
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
