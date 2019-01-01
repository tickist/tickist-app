import {IEnvironment} from './environment.interface';

export const environment: IEnvironment = {
    production: false,
    apiUrl: 'http://localhost:8000/api',
    staticUrl: 'http://localhost:8000',
    e2eTest: true
};
