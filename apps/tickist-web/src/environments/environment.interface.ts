export interface IEnvironment {
    name: string;
    production: boolean;
    e2eTest: boolean;
    emulator: boolean;
    firebase: any;
    experimentalForceLongPolling: boolean;
    emulatorIPAddress?: string;
}
