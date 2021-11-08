import {BehaviorSubject} from 'rxjs';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const FireStorageStub = {
    collection: (name: string) => ({
        doc: (_id: string) => ({
            valueChanges: () => new BehaviorSubject({foo: 'bar'}),
            set: (_d: any) => new Promise<void>((resolve, _reject) => resolve()),
        }),
    }),
};
