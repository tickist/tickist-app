import {IEnvironment} from './environment.interface';

export const environment: IEnvironment = {
    production: true,
    e2eTest: false,
    firebase: {
        apiKey: "AIzaSyAGJ-Uhloe3p24irXJ2bUEUfzSrLMt1qV0",
        authDomain: "tickist-stable.firebaseapp.com",
        databaseURL: "https://tickist-stable.firebaseio.com",
        projectId: "tickist-stable",
        storageBucket: "tickist-stable.appspot.com",
        messagingSenderId: "584375835275",
        appId: "1:584375835275:web:1304bc8302d4e954c9528e",
        measurementId: "G-REJW3KPZK6"
    }
};
