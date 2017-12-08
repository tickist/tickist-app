import {Component, OnInit, Input, OnChanges, ChangeDetectionStrategy} from '@angular/core';
import {Task} from '../../models/tasks';

@Component({
  selector: 'task-name',
  templateUrl: './task-name.component.html',
  styleUrls: ['./task-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskNameComponent implements OnInit, OnChanges {
  @Input() task: Task;
  timeAndEstimateTime = false;
  onlyEstimateTime = false;
  onlyTime = false;

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: any) {
    if (changes['task'].currentValue.estimateTime && changes['task'].currentValue.time) {
      this.onlyEstimateTime = this.onlyTime = false;
      this.timeAndEstimateTime = true;
    }
    if (changes['task'].currentValue.estimateTime && !changes['task'].currentValue.time) {
      this.onlyTime = this.timeAndEstimateTime = false;
      this.onlyEstimateTime = true;
    }
    if (!changes['task'].currentValue.estimateTime && changes['task'].currentValue.time) {
      this.onlyEstimateTime = this.timeAndEstimateTime = false;
      this.onlyTime = true;
    }

  }
}
