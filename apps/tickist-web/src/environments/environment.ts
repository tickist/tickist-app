// The file for the current environment will overwrite this one during build.
// Different environments can be found in ./environment.{dev|prod}.ts, and
// you can create your own and use it with the --env flag.
// The build system defaults to the dev environment.

import { IEnvironment } from "./environment.interface";
import { NgxLoggerLevel } from "ngx-logger";

export const environment: IEnvironment = {
    name: "dev",
    production: false,
    e2eTest: false,
    emulator: true,
    emulatorIPAddress: "",
    emulatorAuthAddress: "",
    experimentalForceLongPolling: false,
    logger: {
        level: NgxLoggerLevel.LOG,
    },
    firebase: {
        apiKey: "AIzaSyDu-vOMokFGi5I3oV5tLN5PIqctHyCNcNg",
        authDomain: "proven-reality-657.firebaseapp.com",
        databaseURL: "https://proven-reality-657.firebaseio.com",
        projectId: "proven-reality-657",
        storageBucket: "proven-reality-657.appspot.com",
        messagingSenderId: "924613962771",
        appId: "1:924613962771:web:52fe355b5723d6af",
    },
};
