import {LoggerConfig} from "ngx-logger/lib/logger.config";

export interface IEnvironment {
    name: string;
    production: boolean;
    e2eTest: boolean;
    emulator: boolean;
    authEmulator?: boolean;
    logger: LoggerConfig;
    firebase: any;
    experimentalForceLongPolling: boolean;
    emulatorIPAddress?: string;
}
