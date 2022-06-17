import {
    Component,
    Input,
    EventEmitter,
    Output,
    OnChanges,
} from "@angular/core";
import { ConfigurationService } from "../../../core/services/configuration.service";
import { TASKS_VIEWS_LIST } from "@data";

@Component({
    selector: "tickist-change-task-view",
    templateUrl: "./change-task-view.component.html",
    styleUrls: ["./change-task-view.component.scss"],
})
export class ChangeTaskViewComponent implements OnChanges {
    @Input() defaultTaskView: string;
    @Output() currentTaskViewEvent: EventEmitter<string> =
        new EventEmitter<string>();
    taskView: any;
    tooltipLabel: string;
    currentTaskView: string;
    defaultTaskViewOptions = TASKS_VIEWS_LIST;

    constructor(protected configurationService: ConfigurationService) {}

    ngOnChanges() {
        this.currentTaskView = this.defaultTaskView;
        this.currentTaskViewEvent.emit(this.defaultTaskView);
    }

    changeTaskView(event) {
        if (this.currentTaskView === this.defaultTaskViewOptions[0].value) {
            this.currentTaskViewEvent.emit(
                this.defaultTaskViewOptions[1].value
            );
            this.currentTaskView = this.defaultTaskViewOptions[1].value;
            this.tooltipLabel = "Change to extended view";
        } else {
            this.currentTaskViewEvent.emit(
                this.defaultTaskViewOptions[0].value
            );
            this.currentTaskView = this.defaultTaskViewOptions[0].value;
            this.tooltipLabel = "Change to simple view";
        }
    }
}
