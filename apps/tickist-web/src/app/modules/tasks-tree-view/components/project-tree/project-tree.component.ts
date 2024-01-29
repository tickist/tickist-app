import { Component, EventEmitter, HostListener, Input, Output } from "@angular/core";
import { Project } from "@data/projects";
import { SelectionModel } from "@angular/cdk/collections";
import { editProjectSettingsRoutesName } from "../../../edit-project/routes-names";
import { Router } from "@angular/router";
import { homeRoutesName } from "../../../../routing.module.name";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { MenuButtonComponent } from "../../../../shared/components/menu-button/menu-button.component";
import { FlexModule } from "@ngbracket/ngx-layout/flex";
import { MatBadgeModule } from "@angular/material/badge";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { NgStyle, NgClass } from "@angular/common";
import { MatTreeModule } from "@angular/material/tree";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: "tickist-project-tree",
    templateUrl: "./project-tree.component.html",
    styleUrls: ["./project-tree.component.scss"],
    standalone: true,
    imports: [
        MatIconModule,
        MatTreeModule,
        NgStyle,
        ExtendedModule,
        MatBadgeModule,
        FlexModule,
        MenuButtonComponent,
        MatMenuModule,
        FaIconComponent,
        NgClass,
    ],
})
export class ProjectTreeComponent {
    @Input() isExpanded: boolean;
    @Input() project: Project;
    @Input() tasksCounter: number;
    @Input() expandProjects: SelectionModel<any>;
    @Input() node: any;
    @Output() toggleNode = new EventEmitter();
    showEditProjectButton = false;
    constructor(private router: Router) {}
    @HostListener("mouseenter")
    onMouseEnter() {
        this.showEditProjectButton = true;
    }

    @HostListener("mouseleave")
    onMouseLeave() {
        this.showEditProjectButton = false;
    }

    toggle() {
        this.toggleNode.emit(this.node);
    }

    navigateToEditProjectView(projectId: string) {
        this.router.navigate([homeRoutesName.home, editProjectSettingsRoutesName.editProject, projectId]);
    }

    navigateToCreateNewChildProject(projectId: string) {
        this.router.navigate([homeRoutesName.home, editProjectSettingsRoutesName.editProject, "createWithAncestor", projectId]);
    }
}
