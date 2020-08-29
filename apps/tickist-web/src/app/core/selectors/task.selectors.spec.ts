import {
    needInfoTasks, needInfoTasksLength,
    nextActionTasks, nextActionTasksLength,
    projectWithoutNextActionTasks,
    projectWithoutNextActionTasksLength,
    selectInboxTasksCounter
} from "./task.selectors";
import {Project, TaskType, Task, TaskProject} from "@data";

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
    describe('#projectWithoutNextActionTasks', () => {
        let projects: Partial<Project>[]
        let tasks: any;
        beforeEach(() => {
            tasks = [
                {id: '1', taskProject: {id: '1'}, taskType: TaskType.NORMAL},
                {id: '2', taskProject: {id: '1'}, taskType: TaskType.NEXT_ACTION},
                {id: '3', taskProject: {id: '2'}, taskType: TaskType.NEED_INFO}
            ]
            projects = [
                {id: '1', name: 'project 1'},
                {id: '2', name: 'project 2'},
            ]
        })
        it('should return projects without next action task type', () => {
            expect(projectWithoutNextActionTasks.projector(tasks, projects)).toStrictEqual([projects[1]])
        })
    })

    describe('#needInfoTasks', () => {
        let tasks: any;
        beforeEach(() => {
            tasks = [
                {id: '1', taskProject: {id: '1'}, taskType: TaskType.NORMAL},
                {id: '2', taskProject: {id: '1'}, taskType: TaskType.NEXT_ACTION},
                {id: '3', taskProject: {id: '2'}, taskType: TaskType.NEED_INFO}
            ]
        });

        it('should return needInfo tasks', () => {
            expect(needInfoTasks.projector(tasks)).toStrictEqual([tasks[2]]);
        });
    });

    describe('#nextActionTasks', () => {
        let tasks: Partial<Task>[];
        beforeEach(() => {
            tasks = [
                {id: '1', taskProject: {id: '1'} as TaskProject, taskType: TaskType.NORMAL},
                {id: '2', taskProject: {id: '1'} as TaskProject, taskType: TaskType.NEXT_ACTION},
                {id: '3', taskProject: {id: '2'} as TaskProject, taskType: TaskType.NEED_INFO}
            ]
        });

        it('should return needInfo tasks', () => {
            expect(nextActionTasks.projector(tasks)).toStrictEqual([tasks[1]])
        });
    });

    describe('#nextActionTasksLength', () => {
        let tasks: Partial<Task>[];
        beforeEach(() => {
            tasks = [
                {id: '1', taskProject: {id: '1'} as TaskProject, taskType: TaskType.NEXT_ACTION},
                {id: '2', taskProject: {id: '1'} as TaskProject, taskType: TaskType.NEXT_ACTION},
                {id: '3', taskProject: {id: '2'} as TaskProject, taskType: TaskType.NEXT_ACTION}
            ]
        });

        it('should return how many tasks (type nextAction) do we have', () => {
            expect(nextActionTasksLength.projector(tasks)).toStrictEqual(tasks.length)
        });
    })

    describe('#needInfoTasksLength', () => {
        let tasks: Partial<Task>[];

        beforeEach(() => {
            tasks = [
                {id: '1', taskProject: {id: '1'} as TaskProject, taskType: TaskType.NEED_INFO},
                {id: '2', taskProject: {id: '1'} as TaskProject, taskType: TaskType.NEED_INFO},
                {id: '3', taskProject: {id: '2'} as TaskProject, taskType: TaskType.NEED_INFO}
            ]
        });

        it('should return how many tasks (type needInfo) do we have', () => {
            expect(needInfoTasksLength.projector(tasks)).toStrictEqual(tasks.length)
        });

    })

    describe('#projectWithoutNextActionTasksLength', () => {
        let projects: any;
        beforeEach(() => {
            projects = [
                {id: '1', name: 'project 1'},
                {id: '2', name: 'project 2'},
            ]
        });

        it('should return how many projects without next action type tasks do we have', () => {
            expect(projectWithoutNextActionTasksLength.projector(projects)).toStrictEqual(projects.length)
        });
    })
});
