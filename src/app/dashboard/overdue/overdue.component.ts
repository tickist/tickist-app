import { Component, OnInit, Input } from '@angular/core';
import {Task} from '../../models/tasks';
import {TaskService} from '../../services/taskService';


@Component({
  selector: 'app-overdue',
  templateUrl: './overdue.component.html',
  styleUrls: ['./overdue.component.scss']
})
export class OverdueComponent implements OnInit {
  @Input() tasks: Task[];
  @Input() defaultTaskView: string;
  taskView: string;

  constructor(private taskService: TaskService) {

  }

  ngOnInit() {
  }

  postponeToToday() {
    this.taskService.postponeToToday();
  }
  changeTaskView(event){
    console.log(event);
    this.taskView = event
  }
}
