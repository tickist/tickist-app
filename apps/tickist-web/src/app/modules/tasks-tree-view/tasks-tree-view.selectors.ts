import {createSelector} from '@ngrx/store';
import {selectAllUndoneTasks} from '../../core/selectors/task.selectors';
import {selectAllProjects} from '../../core/selectors/projects.selectors';

export const selectAllTasksTreeView = createSelector(
    selectAllUndoneTasks,
    selectAllProjects,
    (tasks, projects) => {
        if (tasks.length === 0 || projects.length === 0) return [];
        const projectsLevel0 = projects.filter(project => !project.ancestor);
        const tasksTreeView = [];
        projectsLevel0.forEach(project => {
            tasksTreeView.push(createTreeViewNode(project));
        });

        function createTreeViewNode(currentProject) {
            const filteredTasks = tasks.filter(task => task.taskProject.id === currentProject.id)
                .map(task => {
                    return {
                        task: task
                    };
                });
            const filteredProjects = projects.filter(project => project.ancestor === currentProject.id);

            return {
                project: currentProject,
                children: [
                    ...filteredProjects.map(project => {
                        return createTreeViewNode(project);
                    }),
                    ...filteredTasks,
                    {addTask: true, project: currentProject}
                ]
            };
        }
        return tasksTreeView;
    }
);
