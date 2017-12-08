import { Component, OnInit, Input } from '@angular/core';
import {Task} from '../../models/tasks';

@Component({
  selector: 'app-future',
  templateUrl: './future.component.html',
  styleUrls: ['./future.component.scss']
})
export class FutureComponent implements OnInit {
  @Input() tasks: Task[];
  @Input() defaultTaskView: string;
  taskView: string;


  constructor() {}

  ngOnInit() {
  }

  changeTaskView(event) {
    console.log(event);
    this.taskView = event;
  }

}
