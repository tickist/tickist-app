import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'tickist-no-archived-tasks',
    templateUrl: './no-archived-tasks.component.html',
    styleUrls: ['./no-archived-tasks.component.scss']
})
export class NoArchivedTasksComponent implements OnInit {
    @Input() tasksLength: number;

    constructor() {
    }

    ngOnInit(): void {
    }

}
