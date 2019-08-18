import {selectAllTasksTreeView} from './tasks-tree-view.selectors';
import {Project, SimpleProject} from '../../../../../../libs/data/src/projects/models';
import {Task} from '../../../../../../libs/data/src/tasks/models/tasks';


describe('Tasks tree view filters selectors', () => {
    describe('selectAllTasksTreeView', () => {
        let projectsList: Partial<Project>[];
        let tasksList: Partial<Task>[];
        beforeEach(() => {
            projectsList = [
                {id: 1, name: 'Project 1 L0', level: 0, ancestor: null},
                {id: 5, name: 'Project 5 L1', level: 1, ancestor: 1},
                {id: 9, name: 'Project 9 L2', level: 2, ancestor: 5}
            ];
            tasksList = [
                {id: 1, taskProject: {id: 1} as SimpleProject},
                {id: 5, taskProject: {id: 5} as SimpleProject},
                {id: 9, taskProject: {id: 9} as SimpleProject}
            ];
        });
        it('should return tasks treeViewNodes', () => {
            const expectedArray = [
                {
                    project: projectsList[0],
                    children: [
                        {
                            project: projectsList[1],
                            children: [
                                {
                                    project: projectsList[2],
                                    children: [
                                        {
                                            task: tasksList[2]
                                        },
                                        {
                                            addTask: true, project: projectsList[2]
                                        }
                                    ]
                                },
                                {
                                    task: tasksList[1]
                                },
                                {
                                    addTask: true, project: projectsList[1]
                                }
                            ]
                        },
                        {
                            task: tasksList[0]
                        },
                        {
                            addTask: true, project: projectsList[0]
                        }
                    ]
                }];
            expect(selectAllTasksTreeView.projector(tasksList, projectsList)).toEqual(expectedArray);
        });
    });
});
