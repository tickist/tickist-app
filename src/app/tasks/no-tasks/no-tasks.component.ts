import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {Task} from 'src/app/models/tasks';

@Component({
    selector: 'tickist-no-tasks',
    templateUrl: './no-tasks.component.html',
    styleUrls: ['./no-tasks.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoTasksComponent implements OnInit {
    @Input() tasksLength: number;
    constructor() {
    }

    ngOnInit() {

    }

}
