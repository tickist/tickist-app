/* tslint:disable forin */
declare var jasmine: any;

export class SpyObject {
    constructor(type?: any) {
        if (type) {
            for (const prop in type.prototype) {
                let m: any = null;
                try {
                    m = type.prototype[prop];
                } catch (e) {
                    // As we are creating spys for abstract classes,
                    // these classes might have getters that throw when they are accessed.
                    // As we are only auto creating spys for methods, this
                    // should not matter.
                }
                if (typeof m === 'function') {
                    this.spy(prop);
                }
            }
        }
    }

    spy(name: string) {
        if (!(this as any)[name]) {
            (this as any)[name] = jasmine.createSpy(name);
        }
        return (this as any)[name];
    }

    prop(name: string, value: any) {
        (this as any)[name] = value;
    }

}
