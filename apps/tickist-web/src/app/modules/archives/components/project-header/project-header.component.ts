import { Component, Input } from "@angular/core";
import { Project } from "@data";
import { editProjectSettingsRoutesName } from "../../../edit-project/routes-names";
import { Router } from "@angular/router";
import { homeRoutesName } from "../../../../routing.module.name";
import { tasksProjectsViewRoutesName } from "../../../tasks-projects-view/routes.names";

@Component({
    selector: "tickist-project-header",
    templateUrl: "./project-header.component.html",
    styleUrls: ["./project-header.component.scss"],
})
export class ProjectHeaderComponent {
    @Input() project: Project;
    homeRoutesName = "/" + homeRoutesName.home;
    constructor(private router: Router) {}

    navigateToEditProjectView(projectId: string) {
        this.router.navigate([
            homeRoutesName.home,
            editProjectSettingsRoutesName.editProject,
            projectId,
        ]);
    }

    navigateToProjectView(projectId: string) {
        this.router.navigate([
            homeRoutesName.home,
            tasksProjectsViewRoutesName.tasksProjectsView,
            projectId,
        ]);
    }
}
