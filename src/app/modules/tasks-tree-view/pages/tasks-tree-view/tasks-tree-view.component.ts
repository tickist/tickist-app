import {Component, HostListener, OnInit} from '@angular/core';
import {Project} from '../../../../models/projects';

import {AppStore} from '../../../../store';
import {Store} from '@ngrx/store';
import {Task} from '../../../../models/tasks';
import {selectAllTasksTreeView} from '../../tasks-tree-view.selectors';
import {Observable} from 'rxjs';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material';
import {FlatTreeControl} from '@angular/cdk/tree';


interface TaskTreeViewNode {
    project?: Project;
    task?: Task;
    addTask?: boolean;
    children?: TaskTreeViewNode[];
}

/** Flat node with expandable and level information */
interface FlatNode {
    expandable: boolean;
    name: string;
    level: number;
    addTask: boolean;
    isProject: boolean;
    isTask: boolean;
    task: Task;
    tasksCounter: number;
    project: Project;
}

@Component({
    selector: 'tickist-tasks-tree-view',
    templateUrl: './tasks-tree-view.component.html',
    styleUrls: ['./tasks-tree-view.component.scss']
})
export class TasksTreeViewComponent implements OnInit {
    transformer: any;
    expandedProjectsNode = new Set<number>();
    treeControl = new FlatTreeControl<FlatNode>(
        node => node.level, node => node.expandable);

    treeFlattener: MatTreeFlattener<any, any>;
    dataSource: MatTreeFlatDataSource<any, any>;
    tasksTreeView$: Observable<any>;
    tasksFormCounter = 1;

    constructor(private store: Store<AppStore>) {
        this.transformer = (node: TaskTreeViewNode, level: number) => {
            const isProject = !!node.project;
            const isTask = !!node.task;
            const addTask = !!node.addTask;
            const tasksCounter = node.children ? node.children.length - this.tasksFormCounter : 0;
            return {
                expandable: (!!node.children && node.children.length > 0),
                isTask,
                isProject,
                tasksCounter,
                task: node.task,
                project: node.project,
                addTask: addTask,
                node,
                level: level,
            };
        };

        this.treeFlattener = new MatTreeFlattener(
            this.transformer, this.getLevel, this.isExpandable, this.getChildren);

        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    }

    ngOnInit() {
        // this.dataSource.data = [];
        this.tasksTreeView$ = this.store.select(selectAllTasksTreeView);
        this.tasksTreeView$.subscribe(data => {
            console.log(data);
            if (data.length > 0) {
                this.dataSource.data = data;
                this.treeControl.dataNodes.forEach(node => {
                    if (node.isProject && this.expandedProjectsNode.has(node.project.id)) {
                        this.treeControl.expand(node);
                    }
                });
            }
        });

    }
    
    getLevel(node: any) {
        return node.level;
    }

    isExpandable(node: any) {

        return node.expandable;
    }

    getChildren(node: any) {
        return node.children;
    }

    hasChild = (_: number, node: FlatNode) => node.expandable;

    hasAddTask = (_: number, node: FlatNode) => node.addTask;

    toggle(node: any) {
        if (this.expandedProjectsNode.has(node.project.id)) {
            this.expandedProjectsNode.delete(node.project.id);
        } else {
            this.expandedProjectsNode.add(node.project.id);
        }

    }

}

