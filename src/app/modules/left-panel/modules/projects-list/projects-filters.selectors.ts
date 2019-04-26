import {createFeatureSelector, createSelector} from '@ngrx/store';
import * as _ from 'lodash';
import {ProjectsFiltersState} from './projects-filters.reducers';
import {selectAllProjects} from '../../../../core/selectors/projects.selectors';
import {Project} from '../../../../models/projects';


export const selectProjectsFilters = createFeatureSelector<ProjectsFiltersState>('projectsFilters');

export const selectCurrentProjectFilter = createSelector(
    selectProjectsFilters,
    projectsFilters => projectsFilters.currentFilter
);

export const selectAllProjectsFilters = createSelector(
    selectProjectsFilters,
    projectsFilters => projectsFilters.filters
);

export const selectFilteredProjectsList = createSelector(
    selectAllProjects,
    selectCurrentProjectFilter,
    (projects, filter) => {
        if (!filter) return [];
        return generateDifferentLevelsOfProjects(
            projects.filter(Function(`return ${filter.value}`)())
        );
    }
);


function generateDifferentLevelsOfProjects(projects: Project[]) {
    // @TODO move it to the utils file and add selectedProjects to the argument
    // if (this.selectedProject && !projects.find(project => project.id === this.selectedProject.id)) {
    //     projects.push(this.allProjects.find(project => project.id === this.selectedProject.id));
    // }

    projects = _.orderBy(projects,
        ['isInbox', 'name'],
        ['desc', 'asc']
    );

    const list_of_list = [],
        the_first_level = projects.filter((project) => project.level === 0),
        the_second_level = projects.filter((project) => project.level === 1),
        the_third_level = projects.filter((project) => project.level === 2);
    the_first_level.forEach((item_0) => {
        list_of_list.push(item_0);
        the_second_level.forEach((item_1) => {
            if (item_1.ancestor === item_0.id) {
                list_of_list.push(item_1);
                the_third_level.forEach((item_2) => {
                    if (item_2.ancestor === item_1.id) {
                        list_of_list.push(item_2);
                    }
                });
            }


            // if (item_0.allDescendants.indexOf(item_1.id) > -1) {
            //     list_of_list.push(item_1);
            //     the_third_level.forEach((item_2) => {
            //         if (item_1.allDescendants.indexOf(item_2.id) > -1) {
            //             list_of_list.push(item_2);
            //         }
            //     });
            // }
        });

    });
    // if we have a shared list on the second level
    the_second_level.forEach((item_1) => {
        if (list_of_list.indexOf(item_1) === -1) {
            item_1.level = 0;
            list_of_list.push(item_1);
            the_third_level.forEach((item_2) => {
                if (item_2.ancestor === item_1.id) {
                    list_of_list.push(item_2);
                }
            });
        }
    });
    // if we have the shared lists on the third level
    the_third_level.forEach((item_2) => {
        if (list_of_list.indexOf(item_2) === -1) {
            item_2.level = 0;
            list_of_list.push(item_2);
        }
    });

    return list_of_list;
}
