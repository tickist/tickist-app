import {Component, OnInit, Input} from '@angular/core';
import {Task} from '../../models/tasks';
import {ConfigurationService} from '../../services/configurationService';
import {UserService} from '../../services/userService';
import {User} from '../../models/user';
import {IActiveDateElement} from '../../models/active-data-element.interface';

@Component({
    selector: 'tickist-today',
    templateUrl: './today.component.html',
    styleUrls: ['./today.component.scss']
})
export class TodayComponent implements OnInit {
    @Input() tasks: Task[];
    @Input() defaultTaskView: string;
    taskView: string;
    activeDateElement: IActiveDateElement;
    user: User;

    constructor(protected configurationService: ConfigurationService, protected userService: UserService) {
    }

    ngOnInit() {
        this.configurationService.activeDateElement$.subscribe((activeDateElement) => {
            this.activeDateElement = activeDateElement;
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
