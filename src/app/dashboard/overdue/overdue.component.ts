import {Component, OnInit, Input} from '@angular/core';
import {Task} from '../../models/tasks';
import {TaskService} from '../../services/taskService';
import {UserService} from '../../services/userService';
import {User} from '../../models/user/user';


@Component({
    selector: 'tickist-overdue',
    templateUrl: './overdue.component.html',
    styleUrls: ['./overdue.component.scss']
})
export class OverdueComponent implements OnInit {
    @Input() tasks: Task[];
    @Input() defaultTaskView: string;
    taskView: string;
    user: User;

    constructor(private taskService: TaskService, protected userService: UserService) {}

    ngOnInit() {
        this.userService.user$.subscribe((user) => {
            if (user) {
                this.user = user;
            }
        });
    }

    postponeToToday() {
        this.taskService.postponeToToday();
    }

    changeTaskView(event) {
        this.taskView = event;
        if (this.user.defaultTaskViewOverdueView !== event) {
            this.user.defaultTaskViewOverdueView = event;
            this.userService.updateUser(this.user, true);
        }
    }
}
