import functions from 'firebase-functions-test';
import * as admin from 'firebase-admin';
import {test} from '../create-test-environment';
import {db} from '../init';



describe('onUpdateProject', () => {
    let adminStub, api;
    beforeAll(() => {
        adminStub = jest.spyOn(admin, 'initializeApp');
        api = require('../main');
        db.runTransaction = jest.fn((transaction => {
            const transactionObject = {
                set: jest.fn(),
                update: jest.fn()
            };
            return Promise.resolve(transaction(transactionObject));

        }));
    });

    it('first test', async () => {
        // const wrapped = test.wrap(api.onUpdateProject);
        // await wrapped();
    });

    afterEach(() => {
        test.cleanup();
    });
});
