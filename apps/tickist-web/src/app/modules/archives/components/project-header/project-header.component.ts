import {Component, Input, OnInit} from '@angular/core';
import {Project} from "@data";
import {editProjectSettingsRoutesName} from "../../../edit-project/routes-names";
import {Router} from "@angular/router";
import {homeRoutesName} from '../../../../routing.module.name';
import {tasksProjectsViewRoutesName} from "../../../tasks-projects-view/routes.names";


@Component({
    selector: 'tickist-project-header',
    templateUrl: './project-header.component.html',
    styleUrls: ['./project-header.component.scss']
})
export class ProjectHeaderComponent implements OnInit {
    @Input() project: Project
    homeRoutesName = '/' + homeRoutesName.HOME;
    constructor(private router: Router) {
    }

    ngOnInit(): void {
    }


    navigateToEditProjectView(projectId: string) {
        this.router.navigate([homeRoutesName.HOME, editProjectSettingsRoutesName.EDIT_PROJECT, projectId]);
    }

    navigateToProjectView(projectId: string) {
        this.router.navigate([homeRoutesName.HOME, tasksProjectsViewRoutesName.TASKS_PROJECTS_VIEW, projectId]);
    }
}
