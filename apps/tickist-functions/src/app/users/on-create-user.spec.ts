import functions from 'firebase-functions-test';
import * as admin from 'firebase-admin';
import {test} from '../index.test';
import {db} from '../init';



describe('onCreateUser', function () {
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
        const wrapped = test.wrap(api.onCreateUser);
        await wrapped({
            data: jest.fn(() => {
                return {email: 'bill@tickist.com', id: 1, username: 'bill'};
            })
        });
    });

    afterEach(() => {
        test.cleanup();
    });
});
