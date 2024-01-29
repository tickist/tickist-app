import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from "@angular/core";
import { Project } from "@data/projects";
import { Store } from "@ngrx/store";
import { Task } from "@data/tasks/models/tasks";
import { selectAllTasksTreeView } from "../../tasks-tree-view.selectors";
import { Observable, Subject } from "rxjs";
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from "@angular/material/tree";
import { FlatTreeControl } from "@angular/cdk/tree";
import { takeUntil } from "rxjs/operators";
import { editProjectSettingsRoutesName } from "../../../edit-project/routes-names";
import { Router } from "@angular/router";
import { AddTaskComponent } from "../../../../shared/components/add-task/add-task.component";
import { SingleTaskComponent } from "../../../../single-task/single-task/single-task.component";
import { ProjectTreeComponent } from "../../components/project-tree/project-tree.component";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { NgClass, NgIf } from "@angular/common";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { FlexModule } from "@ngbracket/ngx-layout/flex";

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
    selector: "tickist-tasks-tree-view",
    templateUrl: "./tasks-tree-view.component.html",
    styleUrls: ["./tasks-tree-view.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FlexModule,
        FaIconComponent,
        MatTooltipModule,
        NgClass,
        ExtendedModule,
        MatTreeModule,
        NgIf,
        ProjectTreeComponent,
        SingleTaskComponent,
        AddTaskComponent,
    ],
})
export class TasksTreeViewComponent implements OnInit, OnDestroy {
    transformer: any;
    expandedProjectsNode = new Set<string>();
    treeControl = new FlatTreeControl<FlatNode>(
        (node) => node.level,
        (node) => node.expandable
    );

    treeFlattener: MatTreeFlattener<any, any>;
    dataSource: MatTreeFlatDataSource<any, any>;
    tasksTreeView$: Observable<any>;
    tasksFormCounter = 1;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private store: Store,
        private cd: ChangeDetectorRef,
        private router: Router
    ) {
        this.transformer = (node: TaskTreeViewNode, level: number) => {
            const isProject = !!node.project;
            const isTask = !!node.task;
            const addTask = !!node.addTask;
            const tasksCounter = node.children
                ? node.children.length - this.tasksFormCounter
                : 0;
            return {
                expandable: !!node.children && node.children.length > 0,
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
            this.transformer,
            this.getLevel,
            this.isExpandable,
            this.getChildren
        );

        this.dataSource = new MatTreeFlatDataSource(
            this.treeControl,
            this.treeFlattener
        );
    }

    ngOnInit() {
        this.tasksTreeView$ = this.store.select(selectAllTasksTreeView);
        this.tasksTreeView$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((data) => {
                if (data.length > 0) {
                    this.dataSource.data = data;
                    this.treeControl.dataNodes.forEach((node) => {
                        if (
                            node.isProject &&
                            this.expandedProjectsNode.has(node.project.id)
                        ) {
                            this.treeControl.expand(node);
                        }
                    });
                }
                this.cd.detectChanges();
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

    collapseAll(): void {
        this.treeControl.collapseAll();
    }

    expandAll() {
        this.treeControl.expandAll();
    }

    navigateToCreateProjectView() {
        this.router.navigate([
            "home",
            editProjectSettingsRoutesName.editProject,
        ]);
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        // clearTimeout(this.timer);
    }
}
