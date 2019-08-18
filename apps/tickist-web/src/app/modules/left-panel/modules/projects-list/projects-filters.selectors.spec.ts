import {selectFilteredProjectsList} from './projects-filters.selectors';
import {Project} from '../../../../../../../../libs/data/src/projects/models';
import {Filter} from '@tickist/data/filter';

describe('Projects filters selectors', () => {
    describe('selectFilteredProjectsList', () => {
        let projectsList: Partial<Project>[];
        let filterAll: Filter;
        beforeEach(() => {
            projectsList = [
                {name: 'project 1 level 0', id: 1, level: 0, ancestor: undefined},
                {name: 'project 2 level 0', id: 2, level: 0, ancestor: undefined},
                {name: 'project 3 level 0', id: 3, level: 0, ancestor: undefined},
                {name: 'project 4 level 1', id: 4, level: 1, ancestor: 1},
                {name: 'project 5 level 1', id: 5, level: 1, ancestor: 2},
                {name: 'project 6 level 1', id: 6, level: 1, ancestor: 3},
                {name: 'project 7 level 1', id: 7, level: 1, ancestor: 1},
                {name: 'project 8 level 1', id: 8, level: 1, ancestor: 2},
                {name: 'project 9 level 1', id: 9, level: 1, ancestor: 3},
                {name: 'project 10 level 2', id: 10, level: 2, ancestor: 4},
                {name: 'project 11 level 2', id: 11, level: 2, ancestor: 4},
                {name: 'project 12 level 1', id: 12, level: 1, ancestor: 9999},
                {name: 'project 13 level 2', id: 13, level: 2, ancestor: 9999},
            ];
            filterAll = new Filter({
                'id': 1, 'label': 'filter', 'name': 'All projects',
                'value': `project => project`
            });
        });
        it('should return projects list with specific order', () => {
            expect(selectFilteredProjectsList.projector(projectsList, filterAll)).toEqual([
                {name: 'project 1 level 0', id: 1, level: 0, ancestor: undefined},
                {name: 'project 4 level 1', id: 4, level: 1, ancestor: 1},
                {name: 'project 10 level 2', id: 10, level: 2, ancestor: 4},
                {name: 'project 11 level 2', id: 11, level: 2, ancestor: 4},
                {name: 'project 7 level 1', id: 7, level: 1, ancestor: 1},
                {name: 'project 2 level 0', id: 2, level: 0, ancestor: undefined},
                {name: 'project 5 level 1', id: 5, level: 1, ancestor: 2},
                {name: 'project 8 level 1', id: 8, level: 1, ancestor: 2},
                {name: 'project 3 level 0', id: 3, level: 0, ancestor: undefined},
                {name: 'project 6 level 1', id: 6, level: 1, ancestor: 3},
                {name: 'project 9 level 1', id: 9, level: 1, ancestor: 3},
                {name: 'project 12 level 1', id: 12, level: 0, ancestor: 9999},
                {name: 'project 13 level 2', id: 13, level: 0, ancestor: 9999}
            ]);
        });

        it('should return [] because filter is undefined', () => {
            expect(selectFilteredProjectsList.projector(projectsList, undefined)).toEqual([]);
        });
    });
});
