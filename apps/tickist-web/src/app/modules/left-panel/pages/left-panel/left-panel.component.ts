import {Component, OnInit} from '@angular/core';
import {tasksTreeViewRoutesName} from '../../../tasks-tree-view/routes.names';
import {statisticsRoutesName} from '../../../statistics-view/routes.names';
import {Router} from '@angular/router';
import {tasksTagsViewRoutesName} from '../../../tasks-tags-view/routes.names';
import {homeRoutesName} from '../../../../routing.module.name';


@Component({
    selector: 'tickist-left-panel',
    templateUrl: './left-panel.component.html',
    styleUrls: ['./left-panel.component.scss']
})
export class LeftPanelComponent implements OnInit {

    constructor(private router: Router) {
    }

    ngOnInit() {
    }

    navigateToTags() {
        this.router.navigate([homeRoutesName.HOME, tasksTagsViewRoutesName.TASKS_TAGS_VIEW]);
    }

    navigateToTasksTreeView() {
        this.router.navigate([homeRoutesName.HOME, tasksTreeViewRoutesName.TASKS_TREE_VIEW]);
    }

    navigateToStatisticsView() {
        this.router.navigate([homeRoutesName.HOME, statisticsRoutesName.STATISTICS]);
    }
}
