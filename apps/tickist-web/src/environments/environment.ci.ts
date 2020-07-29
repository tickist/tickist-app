import {IEnvironment} from './environment.interface';

export const environment: IEnvironment = {
    production: true,
    e2eTest: true,
    emulator: true,
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
