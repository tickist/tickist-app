import { selectAllTasksTreeView } from "./tasks-tree-view.selectors";
import { Project } from "@data/projects";
import { Task } from "@data/tasks/models/tasks";
import { TaskProject } from "@data/tasks/models/task-project";

describe("Tasks tree view filters selectors", () => {
    describe("selectAllTasksTreeView", () => {
        let projectsList: Partial<Project>[];
        let tasksList: Partial<Task>[];
        beforeEach(() => {
            projectsList = [
                { id: "1", name: "Project 1 L0", ancestor: null },
                { id: "5", name: "Project 5 L1", ancestor: "1" },
                { id: "9", name: "Project 9 L2", ancestor: "5" },
            ];
            tasksList = [
                { id: "1", taskProject: { id: "1" } as TaskProject },
                { id: "5", taskProject: { id: "5" } as TaskProject },
                { id: "9", taskProject: { id: "9" } as TaskProject },
            ];
        });
        it("should return tasks treeViewNodes", () => {
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
                                            task: tasksList[2],
                                        },
                                        {
                                            addTask: true,
                                            project: projectsList[2],
                                        },
                                    ],
                                },
                                {
                                    task: tasksList[1],
                                },
                                {
                                    addTask: true,
                                    project: projectsList[1],
                                },
                            ],
                        },
                        {
                            task: tasksList[0],
                        },
                        {
                            addTask: true,
                            project: projectsList[0],
                        },
                    ],
                },
            ];
            expect(selectAllTasksTreeView.projector(tasksList, projectsList)).toEqual(expectedArray);
        });
    });
});
