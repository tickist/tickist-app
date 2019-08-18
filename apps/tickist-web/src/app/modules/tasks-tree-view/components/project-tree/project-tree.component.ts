import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {Project} from '../../../../../../../../libs/data/src/lib/projects/models';
import {SelectionModel} from '@angular/cdk/collections';
import {editProjectSettingsRoutesName} from '../../../edit-project/routes-names';
import {Router} from '@angular/router';
import {homeRoutesName} from '../../../../routing.module.name';

@Component({
    selector: 'tickist-project-tree',
    templateUrl: './project-tree.component.html',
    styleUrls: ['./project-tree.component.scss']
})
export class ProjectTreeComponent implements OnInit {
    @Input() isExpanded: boolean;
    @Input() project: Project;
    @Input() tasksCounter: number;
    @Input() expandProjects: SelectionModel<any>;
    @Input() node: any;
    @Output() toggleNode = new EventEmitter();
    showEditProjectButton = false;

    @HostListener('mouseenter')
    onMouseEnter() {
        this.showEditProjectButton = true;
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        this.showEditProjectButton = false;
    }

    constructor(private router: Router) {
    }

    ngOnInit() {
    }

    toggle() {
        this.toggleNode.emit(this.node);
    }

    navigateToEditProjectView(projectId: number) {
        this.router.navigate([homeRoutesName.HOME, {outlets: {content: [editProjectSettingsRoutesName.EDIT_PROJECT, projectId]}}]);
    }

    navigateToCreateNewChildProject(projectId: number) {
        this.router.navigate([
            homeRoutesName.HOME,
            {
                outlets: {
                    content: [
                        editProjectSettingsRoutesName.EDIT_PROJECT, 'createWithAncestor', projectId
                    ]
                }
            }
        ]);
    }
}
