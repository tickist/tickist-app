import {Component, OnInit, Input} from '@angular/core';
import {Task} from '../../models/tasks';
import {UserService} from '../../services/userService';
import {User} from '../../models/user/user';

@Component({
    selector: 'tickist-future',
    templateUrl: './future.component.html',
    styleUrls: ['./future.component.scss']
})
export class FutureComponent implements OnInit {
    @Input() tasks: Task[];
    @Input() defaultTaskView: string;
    taskView: string;
    user: User;


    constructor(protected userService: UserService) {
    }

    ngOnInit() {
        this.userService.user$.subscribe((user) => {
            if (user) {
                this.user = user;
            }
        });
    }

    changeTaskView(event) {
        this.taskView = event;
        if (this.user.defaultTaskViewFutureView !== event) {
            this.user.defaultTaskViewFutureView = event;
            this.userService.updateUser(this.user, true);
        }

    }

}
