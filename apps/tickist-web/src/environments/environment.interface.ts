// import {LoggerConfig} from "ngx-logger";

export interface IEnvironment {
    name: string;
    production: boolean;
    e2eTest: boolean;
    emulator: boolean;
    authEmulator?: boolean;
    logger: any;
    firebase: any;
    experimentalForceLongPolling: boolean;
    emulatorIPAddress?: string;
}
