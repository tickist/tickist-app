/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

declare module '*.json' {
    const value: any;
    export default value;
}

// declare ga as a function to set and sent the events
declare let ga: Function;
