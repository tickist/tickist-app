import {Component, OnInit} from '@angular/core';
import {Observable} from "rxjs";
import {Project} from "@data";
import {Store} from "@ngrx/store";
import {projectWithoutNextActionTasks} from "../../../../core/selectors/task.selectors";

@Component({
    selector: 'tickist-project-without-next-action-tasks',
    templateUrl: './project-without-next-action-tasks.component.html',
    styleUrls: ['./project-without-next-action-tasks.component.scss']
})
export class ProjectWithoutNextActionTasksComponent implements OnInit {
    projects$: Observable<Project[]>

    constructor(private store: Store) {
    }

    ngOnInit(): void {
        this.projects$ = this.store.select(projectWithoutNextActionTasks)
    }

    trackByFn(index, item) {
        return item.id;
    }

}
