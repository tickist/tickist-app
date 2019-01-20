import * as _ from 'lodash';


export function toSnakeCase(object) {
    const objectSnakeCase = {};
    _.keys(object).forEach((elem) => {
        if (_.isArray(object[elem])) {
            objectSnakeCase[_.snakeCase(elem)] = [];
            object[elem].forEach((elem2) => {
                if (elem2) {
                    objectSnakeCase[_.snakeCase(elem)].push(toSnakeCase(elem2));
                }
            });
        } else if (_.isObject(object[elem]) && object[elem]) {
            objectSnakeCase[_.snakeCase(elem)] = toSnakeCase(object[elem]);
        } else {
            objectSnakeCase[_.snakeCase(elem)] = object[elem];
        }

    });
    return objectSnakeCase;
}
