import {IEnvironment} from './environment.interface';

export const environment: IEnvironment  = {
    production: false,
    e2eTest: true,
    apiUrl: 'http://localhost:8000/api',
    staticUrl: 'http://localhost:8000',
    firebase: {}
};
