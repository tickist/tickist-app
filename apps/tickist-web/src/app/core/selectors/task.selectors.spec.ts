import {selectInboxTasksCounter} from "./task.selectors";

describe('Task selectors', () => {
    describe('#selectInboxTasksCounter', () => {
        let user: any;
        let tasks: any;
        beforeEach(() => {
            user = {inboxPk: '1'}
            tasks = [
                {id: '1', taskProject: {id: '1'}},
                {id: '2', taskProject: {id: '1'}},
                {id: '3', taskProject: {id: '2'}}
                ]
        })
        it('should return how many tasks inbox has', () => {
            expect(selectInboxTasksCounter.projector(tasks, user)).toBe(2)
        })
    })
})
