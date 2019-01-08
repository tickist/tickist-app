/* tslint:disable forin */
declare var jasmine: any;
import {DebugElement} from '@angular/core/src/debug/debug_node';
import {Response, ResponseOptions} from '@angular/http';
import {HttpClient} from '@angular/common/http';
import {By} from '@angular/platform-browser';

export class TestHelper {
    /** Gets a child DebugElement by tag name. */
    static getChildByTagName(parent: DebugElement, tagName: string): DebugElement {
        return parent.query(debugEl => debugEl.nativeElement.tagName.toLowerCase() === tagName);
    }

    /**
     * Gets a child DebugElement by css selector.
     *
     * The child of DebugElement are other elements that are "known" to
     * Angular.
     */
    static getChildrenBySelector(parent: DebugElement, selector: string): DebugElement[] {
        const results = [];

        parent.queryAll(By.css(selector)).forEach((el) => results.push(el));
        parent.children.forEach((de) => {
            TestHelper.getChildrenBySelector(de, selector).forEach((el) => results.push(el));
        });

        return results;
    }
}

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
