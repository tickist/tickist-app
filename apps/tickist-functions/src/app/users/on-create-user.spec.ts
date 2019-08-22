
import functions from "firebase-functions-test";
import * as admin from "firebase-admin";
import {test} from '../index.test'


/**
 * mock setup
 */
const mockSet = jest.fn();

mockSet.mockReturnValue(true);

// jest.mock("firebase-admin", () => ({
//     initializeApp: jest.fn(),
//     firestore: jest.fn(),
//     database: () => ({
//         ref: jest.fn(path => ({
//             set: mockSet
//         })),
//         runTransaction: jest.fn()
//     })
// }));


describe('onCreateUser', function () {
    let adminStub, api;
    beforeAll(() => {
        // you can use `sinon.stub` instead
        adminStub = jest.spyOn(admin, "initializeApp");
        api = require("../main");
    })

    it('first test', async () => {
        const wrapped = test.wrap(api.onCreateUser);
        // const snap = test.firestore.makeDocumentSnapshot(
        //     {email: 'email@wp.pl', id: 1}, 'document/users');
        await wrapped( {data: jest.fn(() => {
            return {email: 'email@wp.pl', id: 1}
        })})
        //wrapped(snap)
        // console.log(a)
    })

    afterEach(() => {
        test.cleanup();
    })
});
