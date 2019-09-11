// The file for the current environment will overwrite this one during build.
// Different environments can be found in ./environment.{dev|prod}.ts, and
// you can create your own and use it with the --env flag.
// The build system defaults to the dev environment.

import {IEnvironment} from './environment.interface';

export const environment: IEnvironment = {
    production: false,
    apiUrl: 'http://localhost:8000/api',
    staticUrl: '',
    e2eTest: false
};