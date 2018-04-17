import {Component, OnInit, Input} from '@angular/core';
import {Task} from '../../models/tasks';
import {ConfigurationService} from '../../services/configurationService';
import * as moment from 'moment';
import {UserService} from '../../services/userService';
import {User} from '../../models/user/user';

@Component({
    selector: 'tickist-today',
    templateUrl: './today.component.html',
    styleUrls: ['./today.component.scss']
})
export class TodayComponent implements OnInit {
    @Input() tasks: Task[];
    @Input() defaultTaskView: string;
    taskView: string;
    activeDay: moment.Moment;
    user: User;

    constructor(protected configurationService: ConfigurationService, protected userService: UserService) {
    }

    ngOnInit() {
        this.configurationService.activeDay$.subscribe((activeDay) => {
            this.activeDay = activeDay;
        });
        this.userService.user$.subscribe((user) => {
            if (user) {
                this.user = user;
            }
        });
    }

    changeTaskView(event) {
        this.taskView = event;
        if (this.user.defaultTaskViewTodayView !== event) {
            this.user.defaultTaskViewTodayView = event;
            this.userService.updateUser(this.user, true);
        }

    }

}
