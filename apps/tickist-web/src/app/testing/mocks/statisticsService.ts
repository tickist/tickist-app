import { SpyObject } from "../test.helpers";
import { StatisticsService } from "../../core/services/statistics.service";

export class MockStatisticsService extends SpyObject {
    fakeResponse;
    responseSuccess: boolean;
    currentTasksFilters$: any;
    tasks$: any;

    constructor() {
        super(StatisticsService);
        this.fakeResponse = null;
        this.responseSuccess = true;
    }

    subscribe(success, error) {
        if (this.responseSuccess) {
            success(this.fakeResponse);
        } else {
            error(this.fakeResponse);
        }
    }

    setErrorResponse() {
        this.responseSuccess = false;
    }

    setResponse(json: any): void {
        this.fakeResponse = json;
    }

    getProviders(): Array<any> {
        return [{ provide: StatisticsService, useValue: this }];
    }
}
