import {IEnvironment} from './environment.interface';

export const environment: IEnvironment  = {
    production: false,
    e2eTest: true,
    apiUrl: 'http://localhost:8000/api',
    staticUrl: 'http://localhost:8000',
    firebase: {
        apiKey: "AIzaSyCXjxhMO1-bqlG4y8OGGYO8wacRbR4gDCA",
        authDomain: "tickist-testing.firebaseapp.com",
        databaseURL: "https://tickist-testing.firebaseio.com",
        projectId: "tickist-testing",
        storageBucket: "tickist-testing.appspot.com",
        messagingSenderId: "241679590406",
        appId: "1:241679590406:web:82eedcef4f9583e7a64f87"
    }
};
