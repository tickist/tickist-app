import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from "@angular/core";
import { ConfigurationService } from "../../../core/services/configuration.service";
import { TASKS_VIEWS_LIST } from "@data";

@Component({
    selector: "tickist-change-task-view",
    templateUrl: "./change-task-view.component.html",
    styleUrls: ["./change-task-view.component.scss"],
})
export class ChangeTaskViewComponent implements OnChanges, AfterViewInit {
    @Input() defaultTaskView: string;
    @Output() currentTaskViewEvent: EventEmitter<string> = new EventEmitter<string>();
    @ViewChild("taskViewSwitch", { read: ElementRef }) element: ElementRef | undefined;
    taskView: any;
    tooltipLabel: string;
    currentTaskView: string;
    defaultTaskViewOptions = TASKS_VIEWS_LIST;

    // eslint-disable-next-line max-len
    extended = "M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z";
    // eslint-disable-next-line max-len
    short =
        // eslint-disable-next-line max-len
        "M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z";

    constructor(protected configurationService: ConfigurationService) {}

    ngOnChanges() {
        this.currentTaskView = this.defaultTaskView;
        this.currentTaskViewEvent.emit(this.defaultTaskView);
    }

    changeTaskView() {
        if (this.currentTaskView === this.defaultTaskViewOptions[0].value) {
            this.currentTaskViewEvent.emit(this.defaultTaskViewOptions[1].value);
            this.currentTaskView = this.defaultTaskViewOptions[1].value;
            this.tooltipLabel = "Change to extended view";
        } else {
            this.currentTaskViewEvent.emit(this.defaultTaskViewOptions[0].value);
            this.currentTaskView = this.defaultTaskViewOptions[0].value;
            this.tooltipLabel = "Change to simple view";
        }
    }

    ngAfterViewInit(): void {
        // Solution source: https://stackoverflow.com/questions/62549139/it-is-possible-change-angular-material-mat-slide-toggle-icon
        if (this.element) {
            this.element.nativeElement.querySelector(".mdc-switch__icon--on").firstChild.setAttribute("d", this.short);
            this.element.nativeElement.querySelector(".mdc-switch__icon--off").firstChild.setAttribute("d", this.extended);
        }
    }
}
