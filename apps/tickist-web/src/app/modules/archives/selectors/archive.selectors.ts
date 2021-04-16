import {createSelector} from '@ngrx/store';
import {selectSearchTasksText} from "../../../core/selectors/filters-tasks.selectors";


export const selectArchiveState = state => state.archive;


export const isFetchingArchive = createSelector(
    selectArchiveState,
    archive => archive.isLoading
);


export const getTasksFromArchive = createSelector(
    selectArchiveState,
    archive => archive.tasks
);

export const getTasksFromArchiveWithFilters = createSelector(
    getTasksFromArchive,
    selectSearchTasksText,
    (tasks, searchFilter) => {
        if (searchFilter) {
            const re = new RegExp(searchFilter, 'i');
            tasks = tasks.filter((task) => re.test(task.name));
        }
        return tasks
    }
)
