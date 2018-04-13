import {Component, OnInit, Input} from '@angular/core';
import {Task} from '../../models/tasks';
import {UserService} from '../../services/userService';

@Component({
    selector: 'tickist-future',
    templateUrl: './future.component.html',
    styleUrls: ['./future.component.scss']
})
export class FutureComponent implements OnInit {
    @Input() tasks: Task[];
    @Input() defaultTaskView: string;
    taskView: string;
    
    
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
        this.user.defaultTaskViewFutureView = event;
        this.userService.updateUser(this.user, true);
    }
    
}
