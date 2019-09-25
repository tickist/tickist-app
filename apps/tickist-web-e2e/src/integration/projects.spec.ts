import {createFirebase, login} from '../support/utils';

describe("Projects", () => {
    before(() => {
        login();
        createFirebase()
    });

    describe("Add new projects", () => {
        it("should add new project", () => {

        })
    })
});
