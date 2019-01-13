import {
    Component, OnInit, Input, EventEmitter, Output,
    OnChanges
} from '@angular/core';
import {ConfigurationService} from '../../../services/configuration.service';


@Component({
    selector: 'change-task-view',
    templateUrl: './change-task-view.component.html',
    styleUrls: ['./change-task-view.component.scss']
})
export class ChangeTaskViewComponent implements OnInit, OnChanges {
    @Input() defaultTaskView: string;
    @Output() currentTaskViewEvent: EventEmitter<string> = new EventEmitter<string>();
    taskView: any;
    tooltipLabel: string;
    currentTaskView: string;
    defaultTaskViewOptions: Array<any>;

    constructor(protected configurationService: ConfigurationService) {
        this.defaultTaskViewOptions = this.configurationService.loadConfiguration()['commons']['DEFAULT_TASK_VIEW_OPTIONS'];
    }

    ngOnInit() {
    }

    ngOnChanges() {
        console.log(this.defaultTaskView);
        this.currentTaskView = this.defaultTaskView;
        this.currentTaskViewEvent.emit(this.defaultTaskView);
    }

    changeTaskView(event) {
        console.log(event);
        if (this.currentTaskView === this.defaultTaskViewOptions[0].value) {
            this.currentTaskViewEvent.emit(this.defaultTaskViewOptions[1].value);
            this.currentTaskView = this.defaultTaskViewOptions[1].value;
            this.tooltipLabel = 'Change to extended view';
        } else {
            this.currentTaskViewEvent.emit(this.defaultTaskViewOptions[0].value);
            this.currentTaskView = this.defaultTaskViewOptions[0].value;
            this.tooltipLabel = 'Change to simple view';
        }
    }

}



