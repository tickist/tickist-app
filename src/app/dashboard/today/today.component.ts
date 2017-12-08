import { Component, OnInit, Input } from '@angular/core';
import {Task} from '../../models/tasks';
import {ConfigurationService} from "../../services/configurationService";
import * as moment from 'moment'

@Component({
  selector: 'app-today',
  templateUrl: './today.component.html',
  styleUrls: ['./today.component.scss']
})
export class TodayComponent implements OnInit {
  @Input() tasks: Task[];
  @Input() defaultTaskView: string;
  taskView: string;
  activeDay: moment.Moment;

  constructor(protected configurationService: ConfigurationService) {

  }

  ngOnInit() {
    this.configurationService.activeDay$.subscribe((activeDay) => {
      this.activeDay = activeDay;
    })
  }

  changeTaskView(event){
    console.log(event);
    this.taskView = event
  }

}
