import {Component, OnInit} from '@angular/core';
import {homeRoutesName} from '../../../routing.module';
import {editTaskRoutesName} from '../../../modules/edit-task/routes-names';
import {Router} from '@angular/router';

@Component({
    selector: 'tickist-add-task',
    templateUrl: './add-task.component.html',
    styleUrls: ['./add-task.component.scss']
})
export class AddTaskComponent implements OnInit {

    constructor(private router: Router) {
    }

    ngOnInit() {
    }

    navigateToCreateNewTask() {
        this.router.navigate([homeRoutesName.HOME, {outlets: {content: [editTaskRoutesName.EDIT_TASK]}}]);
    }
}
