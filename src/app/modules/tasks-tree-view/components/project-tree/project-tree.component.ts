import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {Project} from '../../../../models/projects';
import {SelectionModel} from '@angular/cdk/collections';

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

    constructor() {
    }

    ngOnInit() {
    }

    toggle() {
        this.toggleNode.emit(this.node);
    }
}
