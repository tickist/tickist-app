/* SystemJS module definition */
declare let module: NodeModule;
interface NodeModule {
  id: string;
}

declare module '*.json' {
    const value: any;
    export default value;
}

// declare ga as a function to set and sent the events
// eslint-disable-next-line @typescript-eslint/ban-types
declare let ga: Function;
