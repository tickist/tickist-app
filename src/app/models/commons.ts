import * as _ from 'lodash';


export class Api {

    constructor() {

    }

    toApi() {
        const object = {};
        _.keys(this).forEach((elem) => {
            if (_.isArray(this[elem])) {
                object[_.snakeCase(elem)] = [];
                this[elem].forEach((elem2) => {
                    if (elem2.toApi) {
                        object[_.snakeCase(elem)].push(elem2.toApi());
                    }
                });
            } else if (_.isObject(this[elem]) && this[elem].toApi) {
                object[_.snakeCase(elem)] = this[elem].toApi();
            } else {
                object[_.snakeCase(elem)] = this[elem];
            }

        });
        return object;
    }
}
