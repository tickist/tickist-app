import {
  Component, OnInit, Input, ViewContainerRef, EventEmitter, Output, AfterViewInit,
  OnChanges
} from '@angular/core';
import {ConfigurationService} from "../../services/configurationService";


@Component({
  selector: 'change-task-view',
  templateUrl: './change-task-view.component.html',
  styleUrls: ['./change-task-view.component.scss']
})
export class ChangeTaskViewComponent implements OnInit, OnChanges {
  @Input() defaultTaskView: string;
  @Output() currentTaskViewEvent: EventEmitter<string> = new EventEmitter<string>();
  taskView: any;
  currentTaskView: string;
  defaultTaskViewOptions: Array<any>;

  constructor(protected configurationService: ConfigurationService) {
    this.defaultTaskViewOptions = this.configurationService.loadConfiguration()['commons']['DEFAULT_TASK_VIEW_OPTIONS'];
  }

  ngOnInit() {


  }
  ngOnChanges() {
    console.log(this.defaultTaskView)
    this.currentTaskView = this.defaultTaskView;
    this.currentTaskViewEvent.emit(this.defaultTaskView);
  }
  changeTaskView(event) {
    console.log(event);
    if (this.currentTaskView === this.defaultTaskViewOptions[0].name) {
      this.currentTaskViewEvent.emit(this.defaultTaskViewOptions[1].name);
      this.currentTaskView = this.defaultTaskViewOptions[1].name;
    } else {
      this.currentTaskViewEvent.emit(this.defaultTaskViewOptions[0].name);
      this.currentTaskView = this.defaultTaskViewOptions[0].name;
    }
  }

}



