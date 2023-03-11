import { Observable } from "rxjs";
import { MediaObserver } from "@ngbracket/ngx-layout";
import { SpyObject } from "../test.helpers";

export class MockObservableMedia extends SpyObject {
    fakeResponse: any;
    media: any;
    responseSuccess = true;
    media$: Observable<any>;

    constructor() {
        super(MediaObserver);
        this.media = this;
    }
    isActive() {}

    subscribe(success, error) {
        if (this.responseSuccess) {
            success(this.fakeResponse);
        } else {
            error(this.fakeResponse);
        }
    }

    getProviders(): Array<any> {
        return [{ provide: MediaObserver, useValue: this }];
    }
}
