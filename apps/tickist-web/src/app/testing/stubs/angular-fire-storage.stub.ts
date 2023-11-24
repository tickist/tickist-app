import { BehaviorSubject } from "rxjs";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const FireStorageStub = {
    collection: () => ({
        doc: () => ({
            valueChanges: () => new BehaviorSubject({ foo: "bar" }),
            set: () => new Promise<void>((resolve) => resolve()),
        }),
    }),
};
