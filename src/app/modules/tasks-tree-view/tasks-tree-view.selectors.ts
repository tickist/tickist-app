import {createSelector} from '@ngrx/store';
import {selectAllUndoneTasks} from '../../core/selectors/task.selectors';
import {selectAllProjects} from '../../core/selectors/projects.selectors';

export const selectAllTasksTreeView = createSelector(
    selectAllUndoneTasks,
    selectAllProjects,
    (tasks, projects) => {
        if (tasks.length === 0 || projects.length === 0) return [];
        const tasksTreeView = [];
        projects.forEach(project => {
            tasksTreeView.push({
                project,
                children: tasks
                    .filter(task => task.taskProject.id === project.id)
                    .map(task => {
                        return {
                            task: task
                        };
                    })
                    .concat(<any> [{addTask: true, project: project}])
            });
        });

        return tasksTreeView;
    }
);
