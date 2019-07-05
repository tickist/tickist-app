import { Component, OnInit, Input, ChangeDetectionStrategy} from '@angular/core';
import {TaskService} from '../../core/services/task.service';
import {ConfigurationService} from '../../services/configuration.service';
import { MatDialog } from '@angular/material/dialog';


@Component({
    selector: 'tickist-single-task',
    templateUrl: './single-task.component.html',
    styleUrls: ['./single-task.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleTaskComponent implements OnInit {
    @Input() task;
    @Input() mediaChange;
    @Input() taskView;
    @Input() last;
    task_simple_view_value: string;
    task_extended_view_value: string;
    constructor(public taskService: TaskService, private configurationService: ConfigurationService,
                public dialog: MatDialog) {
    }

    ngOnInit() {
        this.task_simple_view_value = this.configurationService.TASK_SIMPLE_VIEW.value;
        this.task_extended_view_value = this.configurationService.TASK_EXTENDED_VIEW.value;
    }
}
